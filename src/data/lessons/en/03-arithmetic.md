---
title: "Arithmetic Instructions"
lesson: 3
---

# Arithmetic Instructions

Now that you know about registers and memory, let's do math with **arithmetic instructions**.

## ADD — Addition

```asm
MOV AX, 10
MOV BX, 20
ADD AX, BX      ; AX = AX + BX = 30
```

`ADD` takes two operands: `ADD destination, source`. The result replaces the destination.

```asm
ADD AX, 5       ; AX = AX + 5
ADD [count], 1  ; Add 1 to memory variable
```

## SUB — Subtraction

```asm
MOV AX, 50
SUB AX, 15      ; AX = AX - 15 = 35
SUB BX, AX      ; BX = BX - AX
```

## INC and DEC — Increment and Decrement

Short forms for adding or subtracting 1:

```asm
INC AX          ; AX = AX + 1
DEC BX          ; BX = BX - 1
INC [count]     ; count = count + 1
```

These are smaller and faster than `ADD AX, 1`.

## CMP — Compare

`CMP` subtracts the second operand from the first **without storing the result**. It only sets flags (Zero, Carry, Sign, etc.):

```asm
MOV AX, 10
CMP AX, 10      ; Zero flag set (AX == 10)
CMP AX, 5       ; Sign flag set (AX > 5)
CMP AX, 20      ; Carry flag set (AX < 20)
```

You'll use `CMP` with conditional jumps (next lesson).

## MUL — Unsigned Multiply

`MUL` multiplies `AL` or `AX` by another value:

```asm
MOV AL, 5
MOV BL, 3
MUL BL          ; AX = AL * BL = 5 * 3 = 15
```

- `MUL r/m8` → multiplies `AL` by operand, result in `AX`
- `MUL r/m16` → multiplies `AX` by operand, result in `DX:AX`

## DIV — Unsigned Divide

```asm
MOV AX, 15
MOV BL, 4
DIV BL          ; AL = quotient (3), AH = remainder (3)
```

- `DIV r/m8` → divides `AX` by operand: quotient in `AL`, remainder in `AH`
- `DIV r/m16` → divides `DX:AX` by operand: quotient in `AX`, remainder in `DX`

## C Equivalent

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
unsigned char al_q = ax_val / 4;  // DIV BL (quotient)
unsigned char ah_r = ax_val % 4;  // DIV BL (remainder)
```

## Full Example

```asm
IDEAL
MODEL small
STACK 100h

DATASEG
    result DW 0

CODESEG
START:
    ; Calculate 5 + 3 * 2
    MOV AX, 3
    MOV BL, 2
    MUL BL          ; AX = 3 * 2 = 6

    ADD AX, 5       ; AX = 6 + 5 = 11
    MOV [result], AX

    MOV AX, 4C00h
    INT 21h
END START
```

## Key Takeaways

- `ADD` and `SUB` work on registers or memory
- `INC` / `DEC` are efficient for ±1
- `CMP` compares by subtraction (sets flags only)
- `MUL` of 8-bit values stores result in `AX`
- `DIV` of 8-bit values puts quotient in `AL`, remainder in `AH`
