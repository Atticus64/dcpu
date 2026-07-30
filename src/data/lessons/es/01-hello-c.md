---
title: "¡Hola, C!"
lesson: 1
---

# ¡Hola, C!

¡Bienvenido a la programación en C! 

C es un **lenguaje compilado de nivel de sistemas** que te da acceso directo a la memoria — muy parecido al assembly.

## Tu Primer Programa en C

```c
#include <stdio.h>

int main() {
    printf("¡Hola, mundo!\n");
    return 0;
}
```

Todo programa en C necesita una función `main` — aquí es donde comienza la ejecución.

## Variables y Tipos

C tiene tipos explícitos para las variables, similar a cómo el assembly tiene diferentes tamaños de registros:

```c
char c = 'A';        // 1 byte  (como DB)
short s = 1000;      // 2 bytes (como DW)
int i = 50000;       // 4 bytes (como DD)
long long l = 123;   // 8 bytes (como DQ)
```

## Asignación y Aritmética

El operador `=` en C es como `MOV` en assembly. La aritmética funciona como esperas:

```c
int x = 10;       // MOV AX, 10
int y = 20;       // MOV BX, 20
int z = x + y;    // ADD AX, BX → resultado en z

x++;              // INC AX
y--;              // DEC BX
```

## Imprimir Salida

```c
#include <stdio.h>

int main() {
    int value = 42;
    printf("La respuesta es %d\n", value);
    return 0;
}
```

- `%d` imprime un entero
- `%x` imprime en hexadecimal
- `%c` imprime un carácter
- `\n` es un salto de línea

## De Assembly a C

| Assembly | C |
|----------|---|
| `mov ax, 42` | `int ax = 42;` |
| `add ax, bx` | `ax = ax + bx;` |
| `mov [var], ax` | `var = ax;` |
| `mov ax, [var]` | `ax = var;` |
| `int 21h` (salida) | `return 0;` |

## Puntos Clave

- Los programas en C comienzan en `main()`
- Las variables tienen tamaños explícitos: `char`, `short`, `int`
- `printf` es cómo imprimes texto y valores
- C abstrae los registros — el compilador los maneja
- C está más cerca del assembly que lenguajes como Python o JavaScript
