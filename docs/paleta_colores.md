# 🎨 Guía de Paleta de Colores - POS OfficeMax

Esta guía define la paleta de colores oficial del proyecto con sus respectivos valores cromáticos (HEX, RGB y HSL) y su configuración en CSS y Tailwind CSS.

---

## 📊 Definición de la Paleta

| Nombre del Color | Código HEX | RGB | HSL |
| :--- | :---: | :---: | :---: |
| **Orange** | `#F64C29` | `rgb(246, 76, 41)` | `hsl(10, 92%, 56%)` |
| **Warm Red** | `#F22C36` | `rgb(242, 44, 54)` | `hsl(357, 88%, 56%)` |
| **Luminous Grey** | `#E6E6E6` | `rgb(230, 230, 230)` | `hsl(0, 0%, 90%)` |
| **Grey** | `#929296` | `rgb(146, 146, 150)` | `hsl(240, 2%, 58%)` |
| **Darkest Grey** | `#111111` | `rgb(17, 17, 17)` | `hsl(0, 0%, 7%)` |
| **Black** | `#000000` | `rgb(0, 0, 0)` | `hsl(0, 0%, 0%)` |

---

## 💻 Integración en el Proyecto

### 1. Variables CSS (`client/src/index.css`)
```css
:root {
  --color-orange: #F64C29;
  --color-warm-red: #F22C36;
  --color-luminous-grey: #E6E6E6;
  --color-grey: #929296;
  --color-darkest-grey: #111111;
  --color-black: #000000;
}
```

### 2. Configuración en Tailwind CSS (`client/src/index.css`)
```css
@theme {
  --color-brand-orange: #F64C29;
  --color-brand-red: #F22C36;
  --color-brand-light-grey: #E6E6E6;
  --color-brand-grey: #929296;
  --color-brand-dark-grey: #111111;
  --color-brand-black: #000000;
}
```
