<template>
  <q-page class="inicio">

    <main class="welcome-container">

      <section
        class="logo-section"
        aria-label="Identidad de SENA Market"
      >

        <div class="cube-scene">

          <!--
            El cubo conserva su animación 3D original (giros de 90°), pero sus
            4 caras laterales muestran SIEMPRE la misma letra: así el cuadro
            nunca se lee "SENA" completo, sino una sola letra por cada giro
            (S -> E -> N -> A -> S ...). La letra vive en la ref "letra".
          -->
          <div
            ref="cube"
            class="cube"
            aria-label="Cubo animado con la letra de SENA Market"
          >

            <div class="cube-face cube-front">
              <span class="letter" aria-hidden="true">{{ letra }}</span>
            </div>

            <div class="cube-face cube-right">
              <span class="letter" aria-hidden="true">{{ letra }}</span>
            </div>

            <div class="cube-face cube-back">
              <span class="letter" aria-hidden="true">{{ letra }}</span>
            </div>

            <div class="cube-face cube-left">
              <span class="letter" aria-hidden="true">{{ letra }}</span>
            </div>

            <div class="cube-face cube-top"></div>

            <div class="cube-face cube-bottom"></div>

          </div>

        </div>

        <div class="brand">

          <div class="brand-name">
            SENA
          </div>

          <div class="brand-market">
            MARKET
          </div>

        </div>

      </section>


      <section class="welcome-content">

        <span class="welcome-label">
          CONTROL DE INVENTARIO
        </span>

        <h1>
          Bienvenido a
          <span>SENA Market</span>
        </h1>

        <p class="welcome-description">
          Una herramienta sencilla para administrar el inventario
          de tu tienda, consultar existencias y mantener el control
          de cada movimiento de mercancía.
        </p>

        <q-btn
          class="start-button"
          unelevated
          rounded
          label="Ingresar al inventario"
          icon-right="none"
          to="/dashboard"
          aria-label="Ingresar al inventario"
        >
          <span class="button-arrow" aria-hidden="true">
            →
          </span>
        </q-btn>

      </section>


      <section
        class="features"
        aria-label="Características principales"
      >

        <div class="feature-item">

          <span class="feature-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 7.5 12 4l8 3.5-8 3-8-3Z"/>
              <path d="M4 7.5V16l8 4 8-4V7.5"/>
              <path d="M12 10.5V20"/>
            </svg>
          </span>

          <span>
            Inventario
          </span>

        </div>


        <div class="feature-divider"></div>


        <div class="feature-item">

          <span class="feature-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M7 7h11"/>
              <path d="m15 3 4 4-4 4"/>
              <path d="M17 17H6"/>
              <path d="m9 13-4 4 4 4"/>
            </svg>
          </span>

          <span>
            Movimientos
          </span>

        </div>


        <div class="feature-divider"></div>


        <div class="feature-item">

          <span class="feature-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 3 21 19H3L12 3Z"/>
              <path d="M12 9v4"/>
              <path d="M12 16h.01"/>
            </svg>
          </span>

          <span>
            Alertas
          </span>

        </div>

      </section>

    </main>


    <footer class="footer">

      <div class="footer-content">

        <span class="footer-brand">
          SENA Market
        </span>

        <span class="footer-dot">
          •
        </span>

        <span>
          Gestión de inventario
        </span>

        <span class="footer-dot">
          •
        </span>

        <span>
          Control simple y eficiente
        </span>

        <span class="footer-year">
          © {{ currentYear }}
        </span>

      </div>

    </footer>

  </q-page>
</template>


<script setup>

import {
  ref,
  computed,
  onMounted,
  onUnmounted
} from 'vue'

import { gsap } from 'gsap'


const cube = ref(null)

// ---------------------------------------------------------------------------
// LETRA DEL CUADRO
// Secuencia fija y siempre igual: S -> E -> N -> A -> S ... (sin azar).
// Las 4 caras laterales del cubo pintan SIEMPRE esta misma letra, de modo
// que el cuadro muestra una sola letra por cada giro y nunca la palabra
// completa dentro del recuadro.
// ---------------------------------------------------------------------------
const LETRAS = ['S', 'E', 'N', 'A']

const letra = ref('S')

// Estado que anima GSAP: giros completados (0 -> 4). La letra se deriva de
// este contador, así no hace falta ningún setInterval/setTimeout suelto.
const ciclo = { giros: 0 }

function actualizarLetra() {
  letra.value = LETRAS[Math.round(ciclo.giros) % LETRAS.length]
}

const currentYear = computed(() => {
  return new Date().getFullYear()
})

let timeline = null


onMounted(() => {

  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  gsap.set(cube.value, {
    rotationX: -8,
    rotationY: 0,
    rotationZ: 0
  })

  // Con "movimiento reducido" activo la letra S queda visible y quieta:
  // se respeta la accesibilidad y no se ejecuta ninguna animación.
  if (reduceMotion) {

    return

  }

  // UN solo timeline gobierna todo el ciclo (rotación + letra). Se repite
  // indefinidamente y no crea setInterval/setTimeout adicionales.
  timeline = gsap.timeline({
    repeat: -1,
    repeatDelay: 10
  })

  // 4 giros de 90°: S -> E -> N -> A -> y vuelve a empezar en S
  for (let giro = 1; giro <= LETRAS.length; giro++) {

    /*
    =========================================
    Giro real del cubo: conserva duración y
    easing del diseño original
    =========================================
    */

    timeline.to(cube.value, {
      rotationY: -90 * giro,
      duration: 1,
      ease: 'power2.inOut'
    })

    /*
    =========================================
    El contador avanza EN PARALELO al giro
    ("<" = mismo instante): la letra cambia
    al cruzar la mitad del giro, así nunca
    se ven dos letras distintas a la vez.
    =========================================
    */

    timeline.to(ciclo, {
      giros: giro,
      duration: 1,
      ease: 'power2.inOut',
      onUpdate: actualizarLetra
    }, '<')

    // Pausa para que la letra se lea antes del siguiente giro
    timeline.to(cube.value, {
      duration: 0.5
    })

  }

})


onUnmounted(() => {

  // Al salir de la bienvenida se detiene TODO: la animación del cubo no
  // puede quedar ejecutándose de fondo bajo el Dashboard.
  if (timeline) {
    timeline.kill()
    timeline = null
  }

})

</script>


<style scoped>

.inicio {

  --primary: #205297;
  --primary-light: #173F70;
  --text: #1E293B;
  --muted: #64748B;
  --border: #E2E8F0;

  position: relative;

  width: 100%;
  min-height: 100vh;

  background:
    radial-gradient(
      circle at 50% 30%,
      rgba(15, 41, 77, 0.055),
      transparent 38%
    ),
    linear-gradient(
      180deg,
      #FFFFFF 0%,
      #FCFDFE 100%
    );

  color: var(--text);

  overflow: hidden;

}


.welcome-container {

  width: min(100%, 760px);

  min-height: 100vh;

  margin: 0 auto;

  padding:
    38px
    24px
    105px;

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  text-align: center;

}


/*
=====================================================
CUBO
=====================================================
*/

.logo-section {

  display: flex;

  flex-direction: column;

  align-items: center;

}


.cube-scene {

  width: 180px;

  height: 170px;

  display: flex;

  align-items: center;

  justify-content: center;

  perspective: 1000px;

  perspective-origin: center center;

}


.cube {

  position: relative;

  width: 116px;

  height: 116px;

  transform-style: preserve-3d;

  transform-origin: center center;

  will-change: transform;

}


.cube-face {

  position: absolute;

  top: 0;

  left: 0;

  width: 116px;

  height: 116px;

  display: flex;

  align-items: center;

  justify-content: center;

  box-sizing: border-box;

  background: #FFFFFF;

  border: 4px solid var(--primary);

  border-radius: 3px;

  backface-visibility: hidden;

  -webkit-backface-visibility: hidden;

}


.cube-front {

  transform:
    translateZ(58px);

}


.cube-right {

  transform:
    rotateY(90deg)
    translateZ(58px);

}


.cube-back {

  transform:
    rotateY(180deg)
    translateZ(58px);

}


.cube-left {

  transform:
    rotateY(-90deg)
    translateZ(58px);

}


.cube-top {

  transform:
    rotateX(90deg)
    translateZ(58px);

}


.cube-bottom {

  transform:
    rotateX(-90deg)
    translateZ(58px);

}


.letter {

  color: var(--primary);

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  font-size: 70px;

  font-weight: 800;

  line-height: 1;

  user-select: none;

}


/*
=====================================================
MARCA
=====================================================
*/

.brand {

  margin-top: 2px;

}


.brand-name {

  color: var(--primary);

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  font-size: 42px;

  font-weight: 800;

  line-height: 1;

  letter-spacing: 7px;

}


.brand-market {

  margin-top: 8px;

  color: var(--primary);

  font-size: 16px;

  font-weight: 600;

  letter-spacing: 8px;

}


/*
=====================================================
BIENVENIDA
=====================================================
*/

.welcome-content {

  width: 100%;

  max-width: 610px;

  margin-top: 34px;

}


.welcome-label {

  display: inline-flex;

  align-items: center;

  justify-content: center;

  padding:
    7px
    13px;

  border-radius: 999px;

  background:
    rgba(15, 41, 77, 0.07);

  color: var(--primary);

  font-size: 10px;

  font-weight: 700;

  letter-spacing: 1.5px;

}


.welcome-content h1 {

  margin:
    15px
    0
    12px;

  color: var(--text);

  font-size: 30px;

  font-weight: 700;

  line-height: 1.2;

}


.welcome-content h1 span {

  color: var(--primary);

}


.welcome-description {

  max-width: 570px;

  margin:
    0
    auto;

  color: var(--muted);

  font-size: 15px;

  line-height: 1.7;

}


/*
=====================================================
BOTÓN
=====================================================
*/

.start-button {

  margin-top: 27px;

  min-height: 48px;

  padding:
    0
    23px;

  background: var(--primary) !important;

  color: #FFFFFF !important;

  font-size: 14px;

  font-weight: 700;

  letter-spacing: 0.1px;

  box-shadow:
    0 8px 22px
    rgba(15, 41, 77, 0.17);

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

}


.start-button:hover {

  transform: translateY(-2px);

  box-shadow:
    0 13px 28px
    rgba(15, 41, 77, 0.23);

}


.start-button:active {

  transform: translateY(0);

}


.button-arrow {

  margin-left: 9px;

  font-size: 20px;

  line-height: 1;

  transition:
    transform 0.2s ease;

}


.start-button:hover .button-arrow {

  transform: translateX(3px);

}


/*
=====================================================
CARACTERÍSTICAS
=====================================================
*/

.features {

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 21px;

  margin-top: 39px;

  padding:
    13px
    21px;

  border:
    1px solid
    var(--border);

  border-radius: 15px;

  background:
    rgba(255, 255, 255, 0.88);

  box-shadow:
    0 6px 22px
    rgba(15, 41, 77, 0.055);

  backdrop-filter: blur(8px);

}


.feature-item {

  display: flex;

  align-items: center;

  gap: 8px;

  color: var(--muted);

  font-size: 12px;

  font-weight: 600;

  white-space: nowrap;

}


.feature-icon {

  width: 23px;

  height: 23px;

  display: inline-flex;

  align-items: center;

  justify-content: center;

  color: var(--primary);

}


.feature-icon svg {

  width: 21px;

  height: 21px;

}


.feature-divider {

  width: 1px;

  height: 23px;

  background: var(--border);

}


/*
=====================================================
FOOTER
=====================================================
*/

.footer {

  position: absolute;

  right: 0;

  bottom: 0;

  left: 0;

  width: 100%;

  padding:
    17px
    24px;

  border-top:
    1px solid
    rgba(226, 232, 240, 0.8);

  background:
    rgba(255, 255, 255, 0.9);

  backdrop-filter: blur(8px);

}


.footer-content {

  display: flex;

  align-items: center;

  justify-content: center;

  flex-wrap: wrap;

  gap: 7px;

  color: #94A3B8;

  font-size: 10px;

  line-height: 1.5;

}


.footer-brand {

  color: var(--primary);

  font-weight: 700;

  letter-spacing: 0.5px;

}


.footer-dot {

  color: #CBD5E1;

}


.footer-year {

  margin-left: 3px;

}


/*
=====================================================
TABLET
=====================================================
*/

@media (max-width: 700px) {

  .welcome-container {

    padding:
      30px
      20px
      100px;

  }


  .cube-scene {

    width: 165px;

    height: 155px;

    transform: scale(0.9);

  }


  .welcome-content {

    margin-top: 27px;

  }


  .features {

    margin-top: 32px;

  }

}


/*
=====================================================
MÓVIL
=====================================================
*/

@media (max-width: 500px) {

  .welcome-container {

    padding:
      20px
      18px
      105px;

  }


  .cube-scene {

    width: 145px;

    height: 140px;

    transform: scale(0.78);

  }


  .brand-name {

    font-size: 35px;

    letter-spacing: 6px;

  }


  .brand-market {

    font-size: 14px;

    letter-spacing: 7px;

  }


  .welcome-content {

    margin-top: 22px;

  }


  .welcome-label {

    font-size: 9px;

  }


  .welcome-content h1 {

    font-size: 25px;

  }


  .welcome-description {

    font-size: 14px;

    line-height: 1.6;

  }


  .start-button {

    width: 100%;

    max-width: 285px;

  }


  .features {

    width: 100%;

    max-width: 350px;

    gap: 10px;

    padding:
      11px
      9px;

  }


  .feature-item {

    gap: 4px;

    font-size: 10px;

  }


  .feature-icon {

    width: 19px;

    height: 19px;

  }


  .feature-icon svg {

    width: 18px;

    height: 18px;

  }


  .footer {

    padding:
      14px
      15px;

  }


  .footer-content {

    font-size: 9px;

  }

}


/*
=====================================================
PANTALLAS BAJAS
=====================================================
*/

@media (max-height: 700px) {

  .welcome-container {

    padding-top: 15px;

  }


  .cube-scene {

    height: 120px;

    transform: scale(0.68);

  }


  .welcome-content {

    margin-top: 7px;

  }


  .welcome-content h1 {

    margin-top: 10px;

    margin-bottom: 8px;

    font-size: 23px;

  }


  .welcome-description {

    font-size: 13px;

    line-height: 1.5;

  }


  .start-button {

    margin-top: 17px;

  }


  .features {

    margin-top: 19px;

  }

}


/*
=====================================================
REDUCIR MOVIMIENTO
=====================================================
*/

@media (prefers-reduced-motion: reduce) {

  .cube {

    transform:
      rotateX(-8deg)
      rotateY(0deg);

  }


  .start-button {

    transition: none;

  }

}

</style>