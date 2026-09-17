Buna zioua. In CIS2 este validarea 
76-050 Cap.1: (R.70 - R.73 * 1000 / R.30)/3 >6300  și <20000 pe fiecare coloană  

ea corespnde 

-- Continue gandul 

Buna dimineata colegi. 
În M1_12.js, pe producție, trebuie înlocuite cele 2 apeluri validateCap1CaemDuplicatesInline(); 
cu validateAllCaemDuplicatesInline();. 
Funcția veche nu este definită 
și provoacă ReferenceError; funcția validateAllCaemDuplicatesInline() există deja în fișier și trebuie doar apelată.


Sau modifc local pe platfoma veche - creiezi branch si il includ la primul deploy  ?
Oricum  local  modific  fisierul js - dar puteti si pe productie -- 



Bună dimineața, colegi.

În M1_12.js, pe producție, trebuie înlocuite cele 2 apeluri:

validateCap1CaemDuplicatesInline();

cu:

validateAllCaemDuplicatesInline();

Funcția validateCap1CaemDuplicatesInline() nu este definită și provoacă eroarea ReferenceError, iar funcția validateAllCaemDuplicatesInline() există deja în fișier și trebuie doar apelată.

Eu oricum voi modifica fișierul JS local, pe platforma veche, și voi crea branch-ul pentru a include corecția la primul deploy.

Dacă este posibil, corecția poate fi făcută și direct pe producție, deoarece modificarea este foarte mică și constă doar în înlocuirea celor două apeluri.