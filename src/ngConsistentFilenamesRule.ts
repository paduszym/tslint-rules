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
import {AbstractWalker, RuleFailure, Rules} from "tslint";
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

class NgConsistentFilenamesWalker extends AbstractWalker<any> {

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
        if (!this._isConsistentFileNaming(className, "Module", "module")) {
            this._addFailure("Niespójność w nazewnictwie modułu Angularowego");
        }
    }

    private _validateNgServiceNaming(className: string): void {
        if (!this._isConsistentFileNaming(className, "Service", "service")) {
            this._addFailure("Niespójność w nazewnictwie serwisu Angularowego");
        }
    }

    private _validateNgComponentNaming(className: string, params: Expression): void {
        if (!this._isConsistentFileNaming(className, "Component", "component")) {
            this._addFailure("Niespójność w nazewnictwie komponentu Angularowego");
        }
        if (!this._isConsistentSelectorNaming(className, "Component", params,
                (ngClassName, selector) => ngClassName === dashCaseToCamelCase(selector.replace(/^test/, "")))) {
            this._addFailure("Selektor niezgodny z nazwą klasy komponentu Angularowego");
        }
    }

    private _validateNgDirectiveNaming(className: string, params: Expression): void {
        if (!this._isConsistentFileNaming(className, "Directive", "directive")) {
            this._addFailure("Niespójność w nazewnictwie dyrektywy Angularowej");
        }
        if (!this._isConsistentSelectorNaming(className, "Directive", params,
                (ngClassName, selector) => selector.match(new RegExp(`\\[test${ngClassName}\\]`)) !== null)) {
            this._addFailure("Selektor niezgodny z nazwą klasy dyrektywy Angularowej");
        }
    }

    private _validateNgPipeNaming(className: string, params: Expression): void {
        if (!this._isConsistentFileNaming(className, "Pipe", "pipe")) {
            this._addFailure("Niespójność w nazewnictwie pipe'a Angularowego");
        }
    }

    private _isConsistentSelectorNaming(className: string, classSuffix: string, decoratorParams: any,
                                        matcher: (_ngClassName: string, _selector: string) => boolean): boolean {
        if (typeof decoratorParams["selector"] === "string") {
            const ngClassName: string = className.replace(new RegExp(`${classSuffix}$`), "");

            return matcher(ngClassName, decoratorParams["selector"]);
        }
        return true;
    }

    private _isConsistentFileNaming(className: string, classSuffix: string, fileNameSuffix: string): boolean {
        const ngFileName: string = basename(this.sourceFile.fileName, `.${fileNameSuffix}.ts`);
        const ngClassName: string = className.replace(new RegExp(`${classSuffix}$`), "");

        return dashCaseToCamelCase(`-${ngFileName}`) === ngClassName;
    }

    private _addFailure(message: string): void {
        this.addFailure(0, 0, `${message} (patrz: ${STYLEGUIDE_URL})`);
    }
}

export class Rule extends Rules.AbstractRule {

    apply(sourceFile: SourceFile): RuleFailure[] {
        return this.applyWithWalker(new NgConsistentFilenamesWalker(sourceFile, this.ruleName, {}));
    }
}
