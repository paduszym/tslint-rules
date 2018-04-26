import * as TsLint from "tslint";
import {
    isArrayLiteralExpression,
    isBlock,
    isCallExpression,
    isClassDeclaration,
    isInterfaceDeclaration,
    isObjectLiteralExpression,
    isSameLine,
    isTypeAliasDeclaration,
} from "tsutils";
import * as ts from "typescript";

export class Rule extends TsLint.Rules.AbstractRule {

    apply(sourceFile: ts.SourceFile): TsLint.RuleFailure[] {
        return this.applyWithWalker(new NoEmptyLinesNearBracketsWalker(sourceFile, this.ruleName, {}));
    }
}

function isBracketExpression(node: ts.Node): boolean {
    return isBlock(node) ||
        isClassDeclaration(node) ||
        isInterfaceDeclaration(node) ||
        isTypeAliasDeclaration(node) ||
        isArrayLiteralExpression(node) ||
        isObjectLiteralExpression(node) ||
        isCallExpression(node);
}

function canHaveOpeningBlankLine(node: ts.Node): boolean {
    return isBlock(node) ||
        isClassDeclaration(node) ||
        isInterfaceDeclaration(node);
}

class NoEmptyLinesNearBracketsWalker extends TsLint.AbstractWalker<any> {

    walk(sourceFile: ts.SourceFile): void {
        const callback: any = (node: ts.Node): void => {
            if (isBracketExpression(node) && !isSameLine(this.sourceFile, node.pos, node.end)) {
                const expressionLines: string[] = node.getText(this.sourceFile).split("\n");

                if (expressionLines.length > 2) {
                    if (expressionLines[1].trim() === "" && !canHaveOpeningBlankLine(node)) {
                        this.addFailure(
                            node.end - node.getText(this.sourceFile).length, node.end,
                            "Niepotrzebna pusta linia po nawiasie otwierającym",
                        );
                    }
                    if (expressionLines[expressionLines.length - 2].trim() === "") {
                        this.addFailure(
                            node.end, node.end,
                            "Niepotrzebna pusta linia przed nawiasem zamykającym",
                        );
                    }
                }
            }

            return ts.forEachChild(node, callback);
        };

        return ts.forEachChild(sourceFile, callback);
    }
}
