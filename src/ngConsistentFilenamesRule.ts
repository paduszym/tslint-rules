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
import {forEachChild, CallExpression, Expression, Node, ObjectLiteralExpression, SourceFile} from "typescript";

const STYLEGUIDE_URL: string = "https://angular.io/guide/styleguide#symbols-and-file-names";

function dashCaseToCamelCase(str: string): string {
    return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
}

function getObjectLiteralFromExpression(expression: ObjectLiteralExpression): any {
    const result: any = {};

    for (const property of expression.properties) {
        if (isPropertyAssignment(property) && isIdentifier(property.name) && isStringLiteral(property.initializer)) {
            result[property.name.escapedText.toString()] = property.initializer.text.toString();
        }
    }

    return result;
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

                            if (decoratorName === "NgModule") {
                                this._validateNgModuleNaming(className);
                            } else if (decoratorName === "Injectable") {
                                this._validateNgServiceNaming(className);
                            } else if (decoratorName === "Component") {
                                this._validateNgComponentNaming(className, decoratorCallExpression.arguments[0]);
                            } else if (decoratorName === "Directive") {
                                this._validateNgDirectiveNaming(className, decoratorCallExpression.arguments[0]);
                            } else if (decoratorName === "Pipe") {
                                this._validateNgPipeNaming(className, decoratorCallExpression.arguments[0]);
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
            this.addFailure(0, 0, `Niespójność w nazewnictwie modułu Angularowego (patrz: ${STYLEGUIDE_URL})`);
        }
    }

    private _validateNgServiceNaming(className: string): void {
        if (!this._isConsistentFileNaming(className, "Service", "service")) {
            this.addFailure(0, 0, `Niespójność w nazewnictwie serwisu Angularowego (patrz: ${STYLEGUIDE_URL})`);
        }
    }

    private _validateNgComponentNaming(className: string, params: Expression): void {
        if (!this._isConsistentFileNaming(className, "Component", "component")) {
            this.addFailure(0, 0, `Niespójność w nazewnictwie komponentu Angularowego (patrz: ${STYLEGUIDE_URL})`);
        }
        if (!this._isConsistentSelectorNaming(className, "Component", params, selector => dashCaseToCamelCase(selector.replace(/^test/, "")))) {
            this.addFailure(0, 0, `Selektor niezgodny z nazwą klasy komponentu Angularowego (patrz: ${STYLEGUIDE_URL})`);
        }
    }

    private _validateNgDirectiveNaming(className: string, params: Expression): void {
        if (!this._isConsistentFileNaming(className, "Directive", "directive")) {
            this.addFailure(0, 0, `Niespójność w nazewnictwie dyrektywy Angularowej (patrz: ${STYLEGUIDE_URL})`);
        }
        if (!this._isConsistentSelectorNaming(className, "Directive", params,
                selector => selector.replace(/\[test([^\]]+)/g, "["))) {
            this.addFailure(0, 0, `Selektor niezgodny z nazwą klasy komponentu Angularowego (patrz: ${STYLEGUIDE_URL})`);
        }
    }

    private _validateNgPipeNaming(className: string, params: Expression): void {
        if (!this._isConsistentFileNaming(className, "Pipe", "pipe")) {
            this.addFailure(0, 0, `Niespójność w nazewnictwie pipe'a Angularowego (patrz: ${STYLEGUIDE_URL})`);
        }
    }

    private _isConsistentSelectorNaming(className: string, classSuffix: string, params: Expression, selectorTransform: (s: string) => string): boolean {
        if (isObjectLiteralExpression(params)) {
            const decoratorParams: any = getObjectLiteralFromExpression(params);

            if (typeof decoratorParams["selector"] === "string") {
                const ngClassName: string = className.replace(new RegExp(`${classSuffix}$`), "");

                return ngClassName === selectorTransform(decoratorParams["selector"]);
            }
        }
        return true;
    }

    private _isConsistentFileNaming(className: string, classSuffix: string, fileNameSuffix: string): boolean {
        const ngFileName: string = basename(this.sourceFile.fileName, `.${fileNameSuffix}.ts`);
        const ngClassName: string = className.replace(new RegExp(`${classSuffix}$`), "");

        return dashCaseToCamelCase(`-${ngFileName}`) === ngClassName;
    }
}

export class Rule extends Rules.AbstractRule {

    apply(sourceFile: SourceFile): RuleFailure[] {
        return this.applyWithWalker(new NgConsistentFilenamesWalker(sourceFile, this.ruleName, {}));
    }
}
