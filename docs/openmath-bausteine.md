# OpenMath-Bausteine — kategorisiertes Inventar

Symbole aus den offiziellen **OpenMath Content Dictionaries** (OpenMath Content Dictionaries — github.com/OpenMath/CDs (cd/Official)), gruppiert als atomare Bausteine für den Baukasten. Stand: 2026-07. **134 Bausteine** aus 20 CDs.

Quelle im Code: `src/data/openmath.js` (diese Datei wird daraus generiert).

> Hinweis: Struktur-Eigenschaften wie *assoziativ*/*kommutativ* sind in OpenMath keine eigenen Symbole, sondern formale Eigenschaften (FMPs) an den Symbolen. Die nächsten atomaren „Eigenschafts“-Bausteine sind Neutralelemente (alg1) und Relations-Eigenschaften (relation3).

## Inhalt

- [Grundmengen (Zahlbereiche)](#zahlbereiche) (6)
- [Verknüpfungen (Operationen)](#verknuepfungen) (17)
- [Relationen](#relationen) (14)
- [Mengen & Mengenoperationen](#mengen) (16)
- [Abbildungen & Funktionen](#abbildungen) (14)
- [Elementarfunktionen & Analysis](#elementarfunktionen) (17)
- [Lineare Algebra](#linalg) (10)
- [Logik & Quantoren](#logik) (13)
- [Relations-Eigenschaften & Abschlüsse](#eigenschaften) (11)
- [Konstanten & Zahl-Konstruktoren](#konstanten) (10)
- [Komplexe Zahlen](#komplex) (6)

## <a id="zahlbereiche"></a>Grundmengen (Zahlbereiche)

Standard-Trägermengen — die Rohmaterialien.

| Symbol | OpenMath-Name | CD | Bedeutung |
|---|---|---|---|
| ℕ | `N` | setname1 | natürliche Zahlen (mit 0) |
| ℤ | `Z` | setname1 | ganze Zahlen |
| ℚ | `Q` | setname1 | rationale Zahlen |
| ℝ | `R` | setname1 | reelle Zahlen |
| ℂ | `C` | setname1 | komplexe Zahlen |
| ℙ | `P` | setname1 | Primzahlen |

## <a id="verknuepfungen"></a>Verknüpfungen (Operationen)

Innere Verknüpfungen und Grundrechenarten.

| Symbol | OpenMath-Name | CD | Bedeutung |
|---|---|---|---|
| + | `plus` | arith1 | Addition (n-är, kommutativ) |
| − | `minus` | arith1 | Subtraktion (binär) |
| −a | `unary_minus` | arith1 | additives Inverses |
| × | `times` | arith1 | Multiplikation (n-är) |
| ÷ | `divide` | arith1 | Division (binär) |
| aᵇ | `power` | arith1 | Potenz |
| √ | `root` | arith1 | n-te Wurzel |
| |a| | `abs` | arith1 | Betrag |
| ggT | `gcd` | arith1 | größter gemeinsamer Teiler |
| kgV | `lcm` | arith1 | kleinstes gemeinsames Vielfaches |
| Σ | `sum` | arith1 | Summe über einen Bereich |
| Π | `product` | arith1 | Produkt über einen Bereich |
| min | `min` | minmax1 | Minimum einer Menge |
| max | `max` | minmax1 | Maximum einer Menge |
| n! | `factorial` | integer1 | Fakultät |
| div | `quotient` | integer1 | ganzzahliger Quotient |
| mod | `remainder` | integer1 | Rest bei Division |

## <a id="relationen"></a>Relationen

Vergleiche und Zugehörigkeiten (liefern Wahrheitswerte).

| Symbol | OpenMath-Name | CD | Bedeutung |
|---|---|---|---|
| = | `eq` | relation1 | gleich |
| ≠ | `neq` | relation1 | ungleich |
| < | `lt` | relation1 | kleiner als |
| ≤ | `leq` | relation1 | kleiner gleich |
| > | `gt` | relation1 | größer als |
| ≥ | `geq` | relation1 | größer gleich |
| ≈ | `approx` | relation1 | ungefähr gleich |
| ∣ | `factorof` | integer1 | teilt (Teilbarkeit) |
| ∈ | `in` | set1 | Element von |
| ∉ | `notin` | set1 | kein Element von |
| ⊆ | `subset` | set1 | Teilmenge |
| ⊊ | `prsubset` | set1 | echte Teilmenge |
| ⊄ | `notsubset` | set1 | keine Teilmenge |
| ⊄ | `notprsubset` | set1 | keine echte Teilmenge |

## <a id="mengen"></a>Mengen & Mengenoperationen

Mengen bilden und verknüpfen; Intervalle und Listen.

| Symbol | OpenMath-Name | CD | Bedeutung |
|---|---|---|---|
| { } | `set` | set1 | explizite Menge |
| ∅ | `emptyset` | set1 | leere Menge |
| ∪ | `union` | set1 | Vereinigung (n-är) |
| ∩ | `intersect` | set1 | Durchschnitt (n-är) |
| ∖ | `setdiff` | set1 | Mengendifferenz |
| × | `cartesian_product` | set1 | kartesisches Produkt |
| |M| | `size` | set1 | Mächtigkeit |
| {x|φ} | `suchthat` | set1 | Menge per Prädikat |
| ↦M | `map` | set1 | Funktion auf Menge anwenden |
| [ ] | `list` | list1 | geordnete Liste |
| [a,b] | `interval` | interval1 | Intervall |
| [a,b] | `interval_cc` | interval1 | abgeschlossenes Intervall |
| (a,b) | `interval_oo` | interval1 | offenes Intervall |
| (a,b] | `interval_oc` | interval1 | halboffen (links offen) |
| [a,b) | `interval_co` | interval1 | halboffen (rechts offen) |
| [a..b] | `integer_interval` | interval1 | ganzzahliges Intervall |

## <a id="abbildungen"></a>Abbildungen & Funktionen

Funktionen bauen, anwenden, verketten, invertieren.

| Symbol | OpenMath-Name | CD | Bedeutung |
|---|---|---|---|
| λ | `lambda` | fns1 | anonyme Funktion (Bindung) |
| id | `identity` | fns1 | Identitätsabbildung |
| dom | `domain` | fns1 | Definitionsbereich |
| ran | `range` | fns1 | Zielbereich |
| im | `image` | fns1 | Bildmenge |
| f|ₐ | `restriction` | fns1 | Einschränkung auf Teilmenge |
| f⁻¹ | `inverse` | fns1 | Umkehrfunktion |
| f⁻¹ₗ | `left_inverse` | fns1 | Linksinverses |
| f⁻¹ᵣ | `right_inverse` | fns1 | Rechtsinverses |
| ∘ | `left_compose` | fns1 | Verkettung (links) |
| ∘ | `right_compose` | fns2 | Verkettung (rechts zuerst) |
| ker | `kernel` | fns2 | Kern der Abbildung |
| f[…] | `apply_to_list` | fns2 | n-äre Funktion auf Liste |
| P[…] | `predicate_on_list` | fns2 | Prädikatkette auf Liste |

## <a id="elementarfunktionen"></a>Elementarfunktionen & Analysis

Transzendente Funktionen, Differenzieren und Integrieren.

| Symbol | OpenMath-Name | CD | Bedeutung |
|---|---|---|---|
| exp | `exp` | transc1 | Exponentialfunktion |
| ln | `ln` | transc1 | natürlicher Logarithmus |
| log | `log` | transc1 | Logarithmus zur Basis |
| sin | `sin` | transc1 | Sinus |
| cos | `cos` | transc1 | Cosinus |
| tan | `tan` | transc1 | Tangens |
| arcsin | `arcsin` | transc1 | Arkussinus |
| arccos | `arccos` | transc1 | Arkuscosinus |
| arctan | `arctan` | transc1 | Arkustangens |
| sinh | `sinh` | transc1 | Sinus hyperbolicus |
| cosh | `cosh` | transc1 | Cosinus hyperbolicus |
| tanh | `tanh` | transc1 | Tangens hyperbolicus |
| d/dx | `diff` | calculus1 | Ableitung (unär) |
| dⁿ/dxⁿ | `nthdiff` | calculus1 | n-te Ableitung |
| ∂ | `partialdiff` | calculus1 | partielle Ableitung |
| ∫ | `int` | calculus1 | unbestimmtes Integral |
| ∫ₐᵇ | `defint` | calculus1 | bestimmtes Integral |

## <a id="linalg"></a>Lineare Algebra

Vektoren, Matrizen und ihre Operationen.

| Symbol | OpenMath-Name | CD | Bedeutung |
|---|---|---|---|
| 𝐯 | `vector` | linalg2 | Vektor |
| M | `matrix` | linalg2 | Matrix |
| Mᵢ | `matrixrow` | linalg2 | Matrixzeile |
| ⟨·,·⟩ | `scalarproduct` | linalg1 | Skalarprodukt (Punktprodukt) |
| × | `vectorproduct` | linalg1 | Kreuzprodukt (3D) |
| ⊗ | `outerproduct` | linalg1 | äußeres Produkt |
| Mᵀ | `transpose` | linalg1 | Transponierte |
| det | `determinant` | linalg1 | Determinante |
| vᵢ | `vector_selector` | linalg1 | Vektor-Komponente |
| Mᵢⱼ | `matrix_selector` | linalg1 | Matrix-Eintrag |

## <a id="logik"></a>Logik & Quantoren

Junktoren, Wahrheitswerte, Quantoren.

| Symbol | OpenMath-Name | CD | Bedeutung |
|---|---|---|---|
| ∧ | `and` | logic1 | Konjunktion (n-är) |
| ∨ | `or` | logic1 | Disjunktion (n-är) |
| ¬ | `not` | logic1 | Negation |
| ⇒ | `implies` | logic1 | Implikation |
| ⇔ | `equivalent` | logic1 | Äquivalenz |
| ⊕ | `xor` | logic1 | exklusives Oder |
| ↑ | `nand` | logic1 | nicht-und |
| ↓ | `nor` | logic1 | nicht-oder |
| ↔ | `xnor` | logic1 | Äquivalenz (xnor) |
| ⊤ | `true` | logic1 | wahr |
| ⊥ | `false` | logic1 | falsch |
| ∀ | `forall` | quant1 | Allquantor |
| ∃ | `exists` | quant1 | Existenzquantor |

## <a id="eigenschaften"></a>Relations-Eigenschaften & Abschlüsse

Eigenschaften von Relationen — die atomaren „Axiom“-Bausteine.

| Symbol | OpenMath-Name | CD | Bedeutung |
|---|---|---|---|
| refl | `is_reflexive` | relation3 | reflexiv? |
| symm | `is_symmetric` | relation3 | symmetrisch? |
| trans | `is_transitive` | relation3 | transitiv? |
| äquiv | `is_equivalence` | relation3 | Äquivalenzrelation? |
| ⊆A×A | `is_relation` | relation3 | ist eine Relation? |
| R⁺ᵣ | `reflexive_closure` | relation3 | reflexive Hülle |
| R⁺ₛ | `symmetric_closure` | relation3 | symmetrische Hülle |
| R⁺ | `transitive_closure` | relation3 | transitive Hülle |
| R≈ | `equivalence_closure` | relation3 | Äquivalenzhülle |
| [a] | `class` | relation3 | Äquivalenzklasse von a |
| M/∼ | `classes` | relation3 | Menge der Klassen |

## <a id="konstanten"></a>Konstanten & Zahl-Konstruktoren

Ausgezeichnete Zahlen und Neutralelemente.

| Symbol | OpenMath-Name | CD | Bedeutung |
|---|---|---|---|
| 0 | `zero` | alg1 | additives Neutralelement |
| 1 | `one` | alg1 | multiplikatives Neutralelement |
| π | `pi` | nums1 | Kreiszahl |
| e | `e` | nums1 | Eulersche Zahl |
| i | `i` | nums1 | imaginäre Einheit |
| ∞ | `infinity` | nums1 | Unendlich |
| γ | `gamma` | nums1 | Euler-Mascheroni-Konstante |
| NaN | `NaN` | nums1 | keine Zahl |
| p/q | `rational` | nums1 | rationale Zahl (Konstruktor) |
| nᵦ | `based_integer` | nums1 | ganze Zahl zur Basis b |

## <a id="komplex"></a>Komplexe Zahlen

Konstruktoren und Bestandteile komplexer Zahlen.

| Symbol | OpenMath-Name | CD | Bedeutung |
|---|---|---|---|
| a+bi | `complex_cartesian` | complex1 | kartesische Form |
| r·e^{iφ} | `complex_polar` | complex1 | Polarform |
| Re | `real` | complex1 | Realteil |
| Im | `imaginary` | complex1 | Imaginärteil |
| arg | `argument` | complex1 | Argument (Winkel) |
| z̄ | `conjugate` | complex1 | komplexe Konjugation |

