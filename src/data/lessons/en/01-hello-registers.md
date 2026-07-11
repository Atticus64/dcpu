---
title: "Hello, Registers!"
lesson: 1
---

# Hello, Registers!

Welcome to your first lesson in x86 assembly! Today we'll learn about **registers** — the CPU's built-in variables.

## In C: Variables

When you write `int a = 42;` in C, you're asking the computer to:

1. Reserve some space in memory (RAM)
2. Label it `a`
3. Store the value `42` there

```c
int a = 42;
int b = 7;
```

This is intuitive — variables live in memory.

## In Assembly: Registers

Inside the CPU itself, there are special, ultra-fast storage locations called **registers**. They're like variables built directly into the processor. Unlike RAM, they have fixed names:

| Register | Name | Common Use |
|----------|------|------------|
| **AX** | Accumulator | Arithmetic, I/O |
| **BX** | Base | Address base |
| **CX** | Counter | Loop counting |
| **DX** | Data | I/O, multiply/divide |

To put a value into a register, use the **`MOV`** instruction:

```asm
MOV AX, 42    ; Copy 42 into AX
MOV BX, 7     ; Copy 7 into BX
```

Think of it like assignment in C:

```c
ax = 42;   // MOV AX, 42
bx = 7;    // MOV BX, 7
```

## IDEAL Mode Syntax

Turbo Assembler's **IDEAL mode** gives us a clean, structured syntax:

```asm
IDEAL                    ; Enable IDEAL mode
MODEL small              ; Memory model
STACK 100h               ; Stack size

DATASEG                  ; Data segment
    ; variables go here

CODESEG                  ; Code segment
START:                   ; Entry point
    MOV AX, 42
    MOV BX, 7

    MOV AX, 4C00h        ; Exit function
    INT 21h              ; DOS interrupt
END START                ; End of program
```

## C Equivalent Program

Here's the same logic in C:

```c
#include <stdio.h>

int main() {
    int ax = 42;    // like MOV AX, 42
    int bx = 7;     // like MOV BX, 7
    return 0;       // like MOV AX, 4C00h / INT 21h
}
```

## Key Takeaways

- **Registers** are the CPU's internal variables
- **`MOV`** copies a value into a register
- **AX** is the main register (accumulator)
- IDEAL mode uses clear sections: `DATASEG`, `CODESEG`
