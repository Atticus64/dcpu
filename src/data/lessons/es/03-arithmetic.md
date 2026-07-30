---
title: "Instrucciones Aritméticas"
lesson: 3
---

# Instrucciones Aritméticas

Ahora que conoces los registros y la memoria, hagamos matemáticas con **instrucciones aritméticas**.

## ADD — Suma

```asm
mov ax, 10
mov bx, 20
add ax, bx      ; AX = AX + BX = 30
```

`ADD` toma dos operandos: `ADD destino, fuente`. El resultado reemplaza al destino.

```asm
add ax, 5       ; AX = AX + 5
add [count], 1  ; Sumar 1 a variable en memoria
```

## SUB — Resta

```asm
mov ax, 50
sub ax, 15      ; AX = AX - 15 = 35
sub bx, ax      ; BX = BX - AX
```

## INC y DEC — Incremento y Decremento

Formas cortas de sumar o restar 1:

```asm
inc ax          ; AX = AX + 1
dec bx          ; BX = BX - 1
inc [count]     ; count = count + 1
```

Son más pequeñas y rápidas que `ADD AX, 1`.

## CMP — Comparar

`CMP` resta el segundo operando del primero **sin almacenar el resultado**. Solo establece banderas (Zero, Carry, Sign, etc.):

```asm
mov ax, 10
cmp ax, 10      ; Bandera Zero activada (AX == 10)
cmp ax, 5       ; Bandera Sign activada (AX > 5)
cmp ax, 20      ; Bandera Carry activada (AX < 20)
```

Usarás `cmp` con saltos condicionales (siguiente lección).

## MUL — Multiplicación sin signo

`mul` multiplica `AL` o `AX` por otro valor:

```asm
mov al, 5
mov bl, 3
mul bl          ; AX = AL * BL = 5 * 3 = 15
```

- `MUL r/m8` → multiplica `AL` por operando, resultado en `AX`
- `MUL r/m16` → multiplica `AX` por operando, resultado en `DX:AX`

## DIV — División sin signo

```asm
mov ax, 15
mov bl, 4
div bl          ; AL = cociente (3), AH = residuo (3)
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
ideal
model small
stack 100h

dataseg
    result dw 0

codeseg
start:
    ; Calcular 5 + 3 * 2
    mov ax, 3
    mov bl, 2
    mul bl
    ; AX = 3 * 2 = 6

    add ax, 5       ; AX = 6 + 5 = 11
    mov [result], ax

    mov ax, 4C00h
    int 21h
end start
```

## Puntos Clave

- `ADD` y `SUB` funcionan en registros o memoria
- `INC` / `DEC` son eficientes para ±1
- `CMP` compara mediante resta (solo establece banderas)
- `MUL` de valores de 8 bits almacena el resultado en `AX`
- `DIV` de valores de 8 bits pone cociente en `AL`, residuo en `AH`
