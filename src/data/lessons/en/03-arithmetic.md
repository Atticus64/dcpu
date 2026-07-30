---
title: "Arithmetic Instructions"
lesson: 3
---

# Arithmetic Instructions

Now that you know about registers and memory, let's do math with **arithmetic instructions**.

## ADD — Addition

```asm
mov ax, 10
mov bx, 20
add ax, bx      ; AX = AX + BX = 30
```

`ADD` takes two operands: `ADD destination, source`. The result replaces the destination.

```asm
add ax, 5       ; AX = AX + 5
add [count], 1  ; Add 1 to memory variable
```

## SUB — Subtraction

```asm
mov ax, 50
sub ax, 15      ; AX = AX - 15 = 35
sub bx, ax      ; BX = BX - AX
```

## INC and DEC — Increment and Decrement

Short forms for adding or subtracting 1:

```asm
inc ax          ; AX = AX + 1
dec bx          ; BX = BX - 1
inc [count]     ; count = count + 1
```

These are smaller and faster than `ADD AX, 1`.

## CMP — Compare

`CMP` subtracts the second operand from the first **without storing the result**. It only sets flags (Zero, Carry, Sign, etc.):

```asm
mov ax, 10
cmp ax, 10      ; Zero flag set (AX == 10)
cmp ax, 5       ; Sign flag set (AX > 5)
cmp ax, 20      ; Carry flag set (AX < 20)
```

You'll use `CMP` with conditional jumps (next lesson).

## MUL — Unsigned Multiply

`MUL` multiplies `AL` or `AX` by another value:

```asm
mov al, 5
mov bl, 3
mul bl          ; AX = AL * BL = 5 * 3 = 15
```

- `MUL r/m8` → multiplies `AL` by operand, result in `AX`
- `MUL r/m16` → multiplies `AX` by operand, result in `DX:AX`

## DIV — Unsigned Divide

```asm
mov ax, 15
mov bl, 4
div bl          ; AL = quotient (3), AH = remainder (3)
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
ideal
model small
stack 100h

dataseg
    result dw 0

codeseg
start:
    ; Calculate 5 + 3 * 2
    mov ax, 3
    mov bl, 2
    mul bl          ; AX = 3 * 2 = 6

    add ax, 5       ; AX = 6 + 5 = 11
    mov [result], ax

    mov ax, 4C00h
    int 21h
end start
```

## Key Takeaways

- `ADD` and `SUB` work on registers or memory
- `INC` / `DEC` are efficient for ±1
- `CMP` compares by subtraction (sets flags only)
- `MUL` of 8-bit values stores result in `AX`
- `DIV` of 8-bit values puts quotient in `AL`, remainder in `AH`
