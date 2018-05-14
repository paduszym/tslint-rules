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
import {AbstractWalker, RuleFailure, Rules} from "tslint";
import {isDecorator, isSameLine, isConstructorDeclaration, isMethodDeclaration} from "tsutils";
import {forEachChild, Node, SourceFile} from "typescript";

function isDecoratorInConstructorOrMethod(node: Node): boolean {
    return (
        node && node.parent && node.parent.parent &&
        (isMethodDeclaration(node.parent.parent) || isConstructorDeclaration(node.parent.parent))
    );
}

class ConsistentDecoratorsWalker extends AbstractWalker<any> {

    walk(sourceFile: SourceFile): void {
        const callback: any = (node: Node): void => {
            if (isDecorator(node) && node.parent) {
                const decoratedExpressionEnd: number = node.parent.getChildAt(1, this.sourceFile).end;

                if (isDecoratorInConstructorOrMethod(node)) {
                    if (!isSameLine(this.sourceFile, node.end, decoratedExpressionEnd)) {
                        this.addFailure(
                            node.end, node.end,
                            "Dekorowane wyrażenie musi być w tej samej linii co dekorator",
                        );
                    }
                } else {
                    if (isSameLine(this.sourceFile, node.end, decoratedExpressionEnd)) {
                        this.addFailure(
                            node.end, node.end,
                            "Dekorowane wyrażenie nie może być w tej samej linii co dekorator",
                        );
                    }
                }
            }

            return forEachChild(node, callback);
        };

        return forEachChild(sourceFile, callback);
    }
}

export class Rule extends Rules.AbstractRule {

    apply(sourceFile: SourceFile): RuleFailure[] {
        return this.applyWithWalker(new ConsistentDecoratorsWalker(sourceFile, this.ruleName, {}));
    }
}
