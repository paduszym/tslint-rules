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
import * as TsLint from "tslint";
import {isDecorator, isSameLine} from "tsutils";
import * as ts from "typescript";

export class Rule extends TsLint.Rules.AbstractRule {

    apply(sourceFile: ts.SourceFile): TsLint.RuleFailure[] {
        return this.applyWithWalker(new NoSingleLineDecoratorsWalker(sourceFile, this.ruleName, {}));
    }
}

function isDecoratorInConstructor(node: ts.Node): boolean {
    return (node && node.parent && node.parent.parent && node.parent.parent.kind === ts.SyntaxKind.Constructor);
}

class NoSingleLineDecoratorsWalker extends TsLint.AbstractWalker<any> {

    walk(sourceFile: ts.SourceFile): void {
        const callback: any = (node: ts.Node): void => {
            if (isDecorator(node) && node.parent) {
                const decoratedExpressionEnd: number = node.parent.getChildAt(1, this.sourceFile).end;

                if (!isDecoratorInConstructor(node) && isSameLine(this.sourceFile, node.end, decoratedExpressionEnd)) {
                    this.addFailure(
                        node.end, node.end,
                        "Dekorowane wyrażenie nie może być w tej samej linii co dekorator",
                    );
                }
            }

            return ts.forEachChild(node, callback);
        };

        return ts.forEachChild(sourceFile, callback);
    }
}
