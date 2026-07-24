# Bausteine-Inventar (OpenMath + Ergänzungen)

**208 Bausteine**: 134 aus den offiziellen OpenMath Content Dictionaries (OpenMath Content Dictionaries — github.com/OpenMath/CDs (cd/Official)) plus 74 Ergänzungen aus elementaren Quellen (Standard-Curriculum + Unicode-Mathematikblock, nicht OpenMath-Core). Stand: 2026-07.

Quelle im Code: `src/data/openmath.js`.

# OpenMath-Core

## <a id="zahlbereiche"></a>Grundmengen (Zahlbereiche)

Standard-Trägermengen — die Rohmaterialien.

| Symbol | Name | Quelle | Bedeutung |
|---|---|---|---|
| ℕ | `N` | setname1 | natürliche Zahlen (mit 0) |
| ℤ | `Z` | setname1 | ganze Zahlen |
| ℚ | `Q` | setname1 | rationale Zahlen |
| ℝ | `R` | setname1 | reelle Zahlen |
| ℂ | `C` | setname1 | komplexe Zahlen |
| ℙ | `P` | setname1 | Primzahlen |

## <a id="verknuepfungen"></a>Verknüpfungen (Operationen)

Innere Verknüpfungen und Grundrechenarten.

| Symbol | Name | Quelle | Bedeutung |
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

| Symbol | Name | Quelle | Bedeutung |
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

| Symbol | Name | Quelle | Bedeutung |
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

| Symbol | Name | Quelle | Bedeutung |
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

| Symbol | Name | Quelle | Bedeutung |
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

| Symbol | Name | Quelle | Bedeutung |
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

| Symbol | Name | Quelle | Bedeutung |
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

| Symbol | Name | Quelle | Bedeutung |
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

| Symbol | Name | Quelle | Bedeutung |
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

| Symbol | Name | Quelle | Bedeutung |
|---|---|---|---|
| a+bi | `complex_cartesian` | complex1 | kartesische Form |
| r·e^{iφ} | `complex_polar` | complex1 | Polarform |
| Re | `real` | complex1 | Realteil |
| Im | `imaginary` | complex1 | Imaginärteil |
| arg | `argument` | complex1 | Argument (Winkel) |
| z̄ | `conjugate` | complex1 | komplexe Konjugation |

# Ergänzungen (Einführungsskripte + Unicode)

## <a id="extra_abbildungen"></a>Abbildungen · Typen & Pfeile

Pfeile und Eigenschaften von Abbildungen — inkl. Linearität.

| Symbol | Name | Quelle | Bedeutung |
|---|---|---|---|
| → | `Abbildung` | Abb | Abbildung f: A → B |
| ↦ | `maps_to` | Abb | Zuordnung x ↦ f(x) |
| ↪ | `hookrightarrow` | Abb | injektive Abb. / Inklusion |
| ↠ | `twoheadrightarrow` | Abb | surjektive Abbildung |
| ⤖ | `bijarrow` | Abb | bijektive Abbildung |
| inj | `injektiv` | Abb | verschiedene Urbilder |
| surj | `surjektiv` | Abb | jedes Element getroffen |
| bij | `bijektiv` | Abb | injektiv und surjektiv |
| lin | `linear` | Abb | f(x+y)=fx+fy, f(λx)=λfx |
| bilin | `bilinear` | Abb | in beiden Argumenten linear |
| Hom | `homomorphismus` | Abb | strukturerhaltende Abbildung |
| ≅ | `isomorphismus` | Abb | bijektiver Homomorphismus |
| f⁻¹(B) | `preimage` | Abb | Urbild einer Menge |

## <a id="extra_geometrie"></a>Geometrie

Elementargeometrische Symbole — in OpenMath-Core nicht enthalten.

| Symbol | Name | Quelle | Bedeutung |
|---|---|---|---|
| ∠ | `winkel` | Geom | Winkel |
| ⊥ | `perpendicular` | Geom | senkrecht / orthogonal |
| ∥ | `parallel` | Geom | parallel |
| ≅ | `kongruent` | Geom | kongruent |
| ∼ | `aehnlich` | Geom | ähnlich |
| △ | `dreieck` | Geom | Dreieck |
| ° | `grad` | Geom | Grad (Winkelmaß) |
| |AB| | `strecke` | Geom | Streckenlänge / Abstand |
| ⊙ | `kreis` | Geom | Kreis |
| ⌢ | `bogen` | Geom | Kreisbogen |
| ∡ | `gerichteter_winkel` | Geom | gerichteter Winkel |
| ∟ | `right_angle` | Geom | rechter Winkel |
| ∦ | `not_parallel` | Geom | nicht parallel |

## <a id="extra_mengen"></a>Mengen · Ergänzungen

Häufige Mengenkonstrukte über die OpenMath-CDs hinaus.

| Symbol | Name | Quelle | Bedeutung |
|---|---|---|---|
| 𝒫 | `powerset` | Mengen | Potenzmenge |
| ∁ | `complement` | Mengen | Komplement (Aᶜ) |
| A△B | `symdiff` | Mengen | symmetrische Differenz |
| (a,b) | `ordered_pair` | Mengen | geordnetes Paar / Tupel |
| ⊔ | `disjoint_union` | Mengen | disjunkte Vereinigung |
| ⋃ | `big_union` | Mengen | indizierte Vereinigung |
| ⋂ | `big_intersect` | Mengen | indizierter Durchschnitt |
| ⊂ | `subset_c` | Mengen | Teilmenge (oft = ⊆) |
| ⊃ | `superset` | Mengen | Obermenge |
| ⊇ | `superset_eq` | Mengen | Obermenge oder gleich |
| ∋ | `contains` | Mengen | enthält als Element |

## <a id="extra_logik"></a>Logik · Ergänzungen

Beweis- und Definitionssymbole.

| Symbol | Name | Quelle | Bedeutung |
|---|---|---|---|
| ∃! | `exists_unique` | Logik | es gibt genau ein |
| ∄ | `nexists` | Logik | es gibt kein |
| := | `defeq` | Logik | definierende Gleichheit |
| ≡ | `identical` | Logik | identisch / definitorisch gleich |
| ⊢ | `vdash` | Logik | beweisbar (Ableitbarkeit) |
| ⊨ | `models` | Logik | erfüllt / modelliert |
| ∴ | `therefore` | Logik | also, daraus folgt |
| ∵ | `because` | Logik | weil |
| ∎ | `qed` | Logik | q.e.d. (Beweisende) |
| ≔ | `colon_equals` | Logik | Definitionszeichen (ein Zeichen) |
| ↔ | `iff` | Logik | genau dann, wenn |
| ≢ | `not_identical` | Logik | nicht identisch / nicht kongruent |

## <a id="extra_relationen"></a>Relationen · Ergänzungen

Weitere Vergleichs- und Äquivalenzsymbole.

| Symbol | Name | Quelle | Bedeutung |
|---|---|---|---|
| ≡ₙ | `congruent_mod` | Rel | kongruent modulo n |
| ≅ | `isomorphic` | Rel | isomorph |
| ∼ | `similar_rel` | Rel | ähnlich / äquivalent |
| ∝ | `proportional` | Rel | proportional |
| ≪ | `much_less` | Rel | sehr viel kleiner |
| ≫ | `much_greater` | Rel | sehr viel größer |
| ∤ | `not_divides` | Rel | teilt nicht |

## <a id="extra_analysis"></a>Analysis & Ordnung · Ergänzungen

Grenzwerte, Schranken, Rundung, weitere Operationen.

| Symbol | Name | Quelle | Bedeutung |
|---|---|---|---|
| sup | `sup` | Analysis | Supremum (kleinste obere Schranke) |
| inf | `inf` | Analysis | Infimum (größte untere Schranke) |
| lim | `lim` | Analysis | Grenzwert |
| ∇ | `nabla` | Analysis | Nabla / Gradient |
| ± | `plusminus` | Analysis | plusminus |
| ⌊x⌋ | `floor` | Analysis | Abrunden (Gaußklammer) |
| ⌈x⌉ | `ceil` | Analysis | Aufrunden |
| (ⁿₖ) | `binomial` | Analysis | Binomialkoeffizient |
| ∓ | `minus_plus` | Analysis | minus-plus |
| ⋅ | `dot_op` | Analysis | Malpunkt (Multiplikation) |

## <a id="extra_linalg"></a>Lineare Algebra · Ergänzungen

Begriffe rund um Vektorräume und lineare Abbildungen.

| Symbol | Name | Quelle | Bedeutung |
|---|---|---|---|
| dim | `dimension` | LinAlg | Dimension |
| span | `span` | LinAlg | lineare Hülle / Erzeugnis |
| rg | `rank` | LinAlg | Rang |
| tr | `trace` | LinAlg | Spur |
| ⊕ | `direct_sum` | LinAlg | direkte Summe |
| ‖·‖ | `norm` | LinAlg | Norm |
| 𝟙 | `identity_matrix` | LinAlg | Einheitsmatrix |
| lin.u. | `lin_independent` | LinAlg | linear unabhängig |

