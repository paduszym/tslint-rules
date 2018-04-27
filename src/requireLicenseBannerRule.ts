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
import * as minimatch from "minimatch";
import {join} from "path";
import * as TsLint from "tslint";
import {SourceFile} from "typescript";

interface RequireLicenseBannerRuleOptions {
    bannerFile: string;
    filePattern: string;
}

interface RequireLicenseBannerWalkerConfig extends RequireLicenseBannerRuleOptions {
    bannerContent: string;
}

class RequireLicenseBannerWalker extends TsLint.RuleWalker {

    private _enabled: boolean;

    private _tslintFix: TsLint.Replacement;

    constructor(sourceFile: SourceFile, options: TsLint.IOptions, private _config: RequireLicenseBannerWalkerConfig) {
        super(sourceFile, options);
        this._enabled = minimatch(join(process.cwd(), sourceFile.fileName), this._config.filePattern);
        this._tslintFix = TsLint.Replacement.appendText(0, `${this._config.bannerContent}`);
    }

    visitSourceFile(sourceFile: SourceFile): void {
        if (!this._enabled) {
            return;
        }

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

export class Rule extends TsLint.Rules.AbstractRule {

    private _walkerConfig: RequireLicenseBannerWalkerConfig;

    constructor(options: TsLint.IOptions) {
        super(options);
        if (options.ruleArguments && options.ruleArguments.length > 0) {
            const ruleOptions: RequireLicenseBannerRuleOptions = options.ruleArguments[0];
            this._walkerConfig = {
                bannerFile: ruleOptions.bannerFile,
                filePattern: ruleOptions.filePattern ? join(__dirname, "..", "..", ruleOptions.filePattern) : "**/*.ts",
                bannerContent: readFileSync(join(__dirname, "..", "..", ruleOptions.bannerFile)).toString().replace(/\r\n/g, "\n"),
            };
        }
    }

    apply(sourceFile: SourceFile): TsLint.RuleFailure[] {
        return this.applyWithWalker(new RequireLicenseBannerWalker(sourceFile, this.getOptions(), this._walkerConfig));
    }
}
