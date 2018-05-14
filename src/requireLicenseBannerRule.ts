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

/**
 * @see https://github.com/angular/material2/blob/master/tools/tslint-rules/requireLicenseBannerRule.ts
 */
import {readFileSync} from "fs";
import {resolve, dirname} from "path";
import {IOptions, Replacement, RuleFailure, Rules, RuleWalker} from "tslint";
import {SourceFile} from "typescript";

interface RequireLicenseBannerRuleOptions {
    bannerFile: string;
}

interface RequireLicenseBannerWalkerConfig extends RequireLicenseBannerRuleOptions {
    bannerContent: string;
}

function getTsLintConfigDir(): string {
    const tslintConfigArgvIndex: number = process.argv.findIndex(arg => arg === "-c" || arg === "--config");
    const tslintConfigFile: string = tslintConfigArgvIndex > -1 ? process.argv[tslintConfigArgvIndex + 1] : "./tsconfig.json";

    return dirname(resolve(tslintConfigFile));
}

class RequireLicenseBannerWalker extends RuleWalker {

    private _tslintFix: Replacement;

    constructor(sourceFile: SourceFile, options: IOptions, private _config: RequireLicenseBannerWalkerConfig) {
        super(sourceFile, options);
        this._tslintFix = Replacement.appendText(0, `${this._config.bannerContent}`);
    }

    visitSourceFile(sourceFile: SourceFile): void {
        const fileContent: string = sourceFile.getFullText().replace(/\r\n/g, "\n");
        const bannerCommentPos: number = fileContent.indexOf(this._config.bannerContent);

        if (bannerCommentPos !== 0) {
            const error: string = `Zawartość pliku musi rozpoczynać się komentarzem z licencją` +
                ` (treść można przekleić z pliku ${this._config.bannerFile})`;
            return this.addFailureAt(0, 0, error, this._tslintFix);
        }

        super.visitSourceFile(sourceFile);
    }
}

export class Rule extends Rules.AbstractRule {

    private _walkerConfig: RequireLicenseBannerWalkerConfig;

    constructor(options: IOptions) {
        super(options);
        if (options.ruleArguments && options.ruleArguments.length > 0) {
            const ruleOptions: RequireLicenseBannerRuleOptions = options.ruleArguments[0];
            const bannerFile: string = resolve(getTsLintConfigDir(), ruleOptions.bannerFile);

            this._walkerConfig = {
                bannerFile,
                bannerContent: readFileSync(bannerFile).toString().replace(/\r\n/g, "\n"),
            };
        }
    }

    apply(sourceFile: SourceFile): RuleFailure[] {
        return this.applyWithWalker(new RequireLicenseBannerWalker(sourceFile, this.getOptions(), this._walkerConfig));
    }
}
