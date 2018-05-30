# TSLint Rules
Zbiór reguł `tslint` wykorzystywanych w projektach OPI.

## Instalacja paczki
W głównym katalogu projektu (tj. tam gdzie znajduje się plik `package.json`) uruchom:

``
npm i @opi/tslint-rules -D
``

## Konfiguracja
W konfiguracji `tslint` (domyślnie plik `tslint.json`) dodaj wpis w sekcji `rulesDirectory`:
```
{
  ...
  "rulesDirectory": [
    ...
    "./node_modules/@opi/tslint-rules/dist"
    ...
  ],
  ...
}
```

## Opis reguł
| Reguła | Opis |
|-------------------------|------------------|
| `consistent-decorators` | Uniemożliwia wstawianie dekoratorów w tej samej linii co dekorowane wyrażenie (nie dotyczy przypadku kiedy dekorator używany jest dla parametru funkcji / konstruktora -- wówczas dekorator i argument muszą być w tej samej linii).
| `ng-consistent-naming`  | Pilnuje spójności w nazewnictwie bytów Angularowych według reguł opisanych na [https://angular.io/guide/styleguide#symbols-and-file-names](https://angular.io/guide/styleguide#symbols-and-file-names). Jako parametr reguła przyjmuje obiekt postaci `{"vendorPrefixes": prefixes}`, gdzie `prefixes` to tablica prefiksów dla selektorów komponentów/dyrektyw używanych w danych projekcie.   
| `no-empty-lines-near-brackets`  | Uniemożliwia pozostawianie pustych linii po lub przed nawiasem / klamrą (nie dotyczy klamer otwierających bloki instrukcji). |
| `require-license-banner` | Sprawdza czy treść pliku zawiera na początku odpowiedni komentarz z licencją. Jako parametr reguła przyjmuje obiekt postaci: `{ "bannerFile": file }` gdzie `file` to nazwa pliku w którym zawarta jest treść komentarza z licencją.
