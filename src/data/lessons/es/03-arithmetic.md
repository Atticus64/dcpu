---
title: "Instrucciones Aritméticas"
lesson: 3
---

# Instrucciones Aritméticas

Ahora que conoces los registros y la memoria, hagamos matemáticas con **instrucciones aritméticas**.

## ADD — Suma

```asm
MOV AX, 10
MOV BX, 20
ADD AX, BX      ; AX = AX + BX = 30
```

`ADD` toma dos operandos: `ADD destino, fuente`. El resultado reemplaza al destino.

```asm
ADD AX, 5       ; AX = AX + 5
ADD [count], 1  ; Sumar 1 a variable en memoria
```

## SUB — Resta

```asm
MOV AX, 50
SUB AX, 15      ; AX = AX - 15 = 35
SUB BX, AX      ; BX = BX - AX
```

## INC y DEC — Incremento y Decremento

Formas cortas de sumar o restar 1:

```asm
INC AX          ; AX = AX + 1
DEC BX          ; BX = BX - 1
INC [count]     ; count = count + 1
```

Son más pequeñas y rápidas que `ADD AX, 1`.

## CMP — Comparar

`CMP` resta el segundo operando del primero **sin almacenar el resultado**. Solo establece banderas (Zero, Carry, Sign, etc.):

```asm
MOV AX, 10
CMP AX, 10      ; Bandera Zero activada (AX == 10)
CMP AX, 5       ; Bandera Sign activada (AX > 5)
CMP AX, 20      ; Bandera Carry activada (AX < 20)
```

Usarás `CMP` con saltos condicionales (siguiente lección).

## MUL — Multiplicación sin signo

`MUL` multiplica `AL` o `AX` por otro valor:

```asm
MOV AL, 5
MOV BL, 3
MUL BL          ; AX = AL * BL = 5 * 3 = 15
```

- `MUL r/m8` → multiplica `AL` por operando, resultado en `AX`
- `MUL r/m16` → multiplica `AX` por operando, resultado en `DX:AX`

## DIV — División sin signo

```asm
MOV AX, 15
MOV BL, 4
DIV BL          ; AL = cociente (3), AH = residuo (3)
```

- `DIV r/m8` → divide `AX` por operando: cociente en `AL`, residuo en `AH`
- `DIV r/m16` → divide `DX:AX` por operando: cociente en `AX`, residuo en `DX`

## Equivalente en C

```c
int ax = 10, bx = 20;
ax = ax + bx;           // ADD AX, BX

ax = 5;                 // MOV AX, 5
ax = ax + 5;            // ADD AX, 5

ax++;                   // INC AX
bx--;                   // DEC BX

unsigned char al = 5;
unsigned short ax = al * 3;  // MUL BL

unsigned short ax_val = 15;
unsigned char al_q = ax_val / 4;  // DIV BL (cociente)
unsigned char ah_r = ax_val % 4;  // DIV BL (residuo)
```

## Ejemplo Completo

```asm
IDEAL
MODEL small
STACK 100h

DATASEG
    result DW 0

CODESEG
START:
    ; Calcular 5 + 3 * 2
    MOV AX, 3
    MOV BL, 2
    MUL BL          ; AX = 3 * 2 = 6

    ADD AX, 5       ; AX = 6 + 5 = 11
    MOV [result], AX

    MOV AX, 4C00h
    INT 21h
END START
```

## Puntos Clave

- `ADD` y `SUB` funcionan en registros o memoria
- `INC` / `DEC` son eficientes para ±1
- `CMP` compara mediante resta (solo establece banderas)
- `MUL` de valores de 8 bits almacena el resultado en `AX`
- `DIV` de valores de 8 bits pone cociente en `AL`, residuo en `AH`
