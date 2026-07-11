---
title: "Hello, C!"
lesson: 1
---

# Hello, C!

Welcome to C programming! C is a **compiled, systems-level language** that gives you direct access to memory — much like assembly.

## Your First C Program

```c
#include <stdio.h>

int main() {
    printf("Hello, world!\n");
    return 0;
}
```

Every C program needs a `main` function — this is where execution begins.

## Variables and Types

C has explicit types for variables, similar to how assembly has different register sizes:

```c
char c = 'A';        // 1 byte  (like DB)
short s = 1000;      // 2 bytes (like DW)
int i = 50000;       // 4 bytes (like DD)
long long l = 123;   // 8 bytes (like DQ)
```

## Assignment and Arithmetic

The `=` operator in C is like `MOV` in assembly. Arithmetic works like you'd expect:

```c
int x = 10;       // MOV AX, 10
int y = 20;       // MOV BX, 20
int z = x + y;    // ADD AX, BX → result in z

x++;              // INC AX
y--;              // DEC BX
```

## Printing Output

```c
#include <stdio.h>

int main() {
    int value = 42;
    printf("The answer is %d\n", value);
    return 0;
}
```

- `%d` prints an integer
- `%x` prints in hexadecimal
- `%c` prints a character
- `\n` is a newline

## From Assembly to C

| Assembly | C |
|----------|---|
| `MOV AX, 42` | `int ax = 42;` |
| `ADD AX, BX` | `ax = ax + bx;` |
| `MOV [var], AX` | `var = ax;` |
| `MOV AX, [var]` | `ax = var;` |
| `INT 21h` (exit) | `return 0;` |

## Key Takeaways

- C programs start at `main()`
- Variables have explicit sizes: `char`, `short`, `int`
- `printf` is how you print text and values
- C abstracts away registers — the compiler handles them
- C is closer to assembly than languages like Python or JavaScript
