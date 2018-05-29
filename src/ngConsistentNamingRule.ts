/**
 * @license
 * To oprogramowanie jest własnością
 *
 * OPI - Ośrodek Przetwarzania Informacji,
 * Al. Niepodległości 188B, 00-608 Warszawa
 * Numer KRS: 0000127372
 * Sąd Rejonowy dla m. st. Warszawy w Warszawie XII Wydział
 * Gospodarczy KRS
 * REGON: 006746090
 * NIP: 525-000-91-40
 *
 * Wszystkie prawa zastrzeżone. To oprogramowanie może być używane tylko
 * zgodnie z przeznaczeniem. OPI nie odpowiada za ewentualne wadliwe
 * działanie kodu.
 */
import {basename} from "path";
import {AbstractWalker, IOptions, RuleFailure, Rules} from "tslint";
import {
    isCallExpression,
    isClassDeclaration,
    isIdentifier,
    isObjectLiteralExpression,
    isPropertyAssignment,
    isStringLiteral,
} from "tsutils";
import {forEachChild, CallExpression, Expression, Node, SourceFile} from "typescript";

const STYLEGUIDE_URL: string = "https://angular.io/guide/styleguide#symbols-and-file-names";

interface NgConsistentNamingRuleOptions {
    vendorPrefixes: string[];
}

function dashCaseToCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
}

function getObjectLiteralFromExpression(expression: Expression): any {
    if (expression && isObjectLiteralExpression(expression)) {
        const result: any = {};

        for (const property of expression.properties) {
            if (isPropertyAssignment(property) && isIdentifier(property.name) && isStringLiteral(property.initializer)) {
                result[property.name.escapedText.toString()] = property.initializer.text.toString();
            }
        }

        return result;
    }
    return null;
}

function isConsistentNgNaming(className: string, classSuffix: string, expression: string,
                              matcher: (_ngClassName: string, _expression: string) => boolean): boolean {
    if (typeof expression === "string") {
        const ngClassName: string = className.replace(new RegExp(`${classSuffix}$`), "");

        return matcher(ngClassName, expression);
    }
    return true;
}

function isConsistentFileNaming(fileName: string, className: string, classSuffix: string, fileNameSuffix: string): boolean {
    const ngFileName: string = basename(fileName, fileNameSuffix);
    const ngClassName: string = className.replace(new RegExp(`${classSuffix}$`), "");

    return dashCaseToCamelCase(`-${ngFileName}`) === ngClassName;
}

class NgConsistentNamingWalker extends AbstractWalker<NgConsistentNamingRuleOptions> {

    walk(sourceFile: SourceFile): void {
        const callback: any = (node: Node): void => {
            if (isClassDeclaration(node) && node.decorators && node.decorators.length > 0) {
                for (const decorator of node.decorators) {
                    if (isCallExpression(decorator.expression)) {
                        const decoratorCallExpression: CallExpression = decorator.expression;

                        if (isIdentifier(decoratorCallExpression.expression)) {
                            const className: string = node.name.escapedText.toString();
                            const decoratorName: string = decoratorCallExpression.expression.escapedText.toString();
                            const decoratorArgs: any = getObjectLiteralFromExpression(decoratorCallExpression.arguments[0]);

                            if (decoratorName === "NgModule") {
                                this._validateNgModuleNaming(className);
                            } else if (decoratorName === "Injectable") {
                                this._validateNgServiceNaming(className);
                            } else if (decoratorName === "Component") {
                                this._validateNgComponentNaming(className, decoratorArgs);
                            } else if (decoratorName === "Directive") {
                                this._validateNgDirectiveNaming(className, decoratorArgs);
                            } else if (decoratorName === "Pipe") {
                                this._validateNgPipeNaming(className, decoratorArgs);
                            }
                        }
                    }
                }
            }

            return forEachChild(node, callback);
        };

        return forEachChild(sourceFile, callback);
    }

    private _validateNgModuleNaming(className: string): void {
        if (!isConsistentFileNaming(this.sourceFile.fileName, className, "Module", ".module.ts")) {
            this._addFailure("Niespójność w nazewnictwie modułu Angularowego");
        }
    }

    private _validateNgServiceNaming(className: string): void {
        if (!isConsistentFileNaming(this.sourceFile.fileName, className, "Service", ".service.ts")) {
            this._addFailure("Niespójność w nazewnictwie serwisu Angularowego");
        }
    }

    private _validateNgComponentNaming(className: string, params: any): void {
        const vendorSelectorRegex: RegExp = new RegExp(`^(${this.options.vendorPrefixes.join("|")})`);

        if (!isConsistentFileNaming(this.sourceFile.fileName, className, "Component", ".component.ts")) {
            this._addFailure("Niespójność w nazewnictwie komponentu Angularowego");
        }
        if (!isConsistentFileNaming(params["templateUrl"], className, "Component", ".component.html")) {
            this._addFailure("Niespójność w nazewnictwie szablonu komponentu Angularowego");
        }
        if (!isConsistentNgNaming(className, "Component", params["selector"],
                (ngClassName, selector) => ngClassName === dashCaseToCamelCase(selector.replace(vendorSelectorRegex, "")))) {
            this._addFailure("Selektor niezgodny z nazwą klasy komponentu Angularowego");
        }
    }

    private _validateNgDirectiveNaming(className: string, params: any): void {
        const vendorPrefixes: string = this.options.vendorPrefixes.join("|");

        if (!isConsistentFileNaming(this.sourceFile.fileName, className, "Directive", ".directive.ts")) {
            this._addFailure("Niespójność w nazewnictwie dyrektywy Angularowej");
        }
        if (!isConsistentNgNaming(className, "Directive", params["selector"],
                (ngClassName, selector) => selector.match(new RegExp(`\\[${vendorPrefixes}${ngClassName}\\]`)) !== null)) {
            this._addFailure("Selektor niezgodny z nazwą klasy dyrektywy Angularowej");
        }
    }

    private _validateNgPipeNaming(className: string, params: any): void {
        if (!isConsistentFileNaming(this.sourceFile.fileName, className, "Pipe", ".pipe.ts")) {
            this._addFailure("Niespójność w nazewnictwie pipe'a Angularowego");
        }
        if (!isConsistentNgNaming(className, "Pipe", params["name"],
                (ngClassName, name) => ngClassName === name.replace(/^(.)/, match => match.toUpperCase()))) {
            this._addFailure("Nazwa niezgodna z nazwą klasy pipe'a Angularowego");
        }
    }

    private _addFailure(message: string): void {
        this.addFailure(0, 0, `${message} (patrz: ${STYLEGUIDE_URL})`);
    }
}

export class Rule extends Rules.AbstractRule {

    private _walkerOptions: NgConsistentNamingRuleOptions = { vendorPrefixes: [] };

    constructor(options: IOptions) {
        super(options);
        if (options.ruleArguments && options.ruleArguments.length > 0) {
            this._walkerOptions = options.ruleArguments[0];
        }
    }

    apply(sourceFile: SourceFile): RuleFailure[] {
        return this.applyWithWalker(new NgConsistentNamingWalker(sourceFile, this.ruleName, this._walkerOptions));
    }
}
