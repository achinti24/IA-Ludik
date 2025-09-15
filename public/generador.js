document.addEventListener("DOMContentLoaded", () => {
  // ==============================
  // 1. REFERENCIAS Y VARIABLES
  // ==============================
  const messages = document.getElementById("messages");
  const input = document.getElementById("input");
  const send = document.getElementById("send");

  let step = -2; // inicia en presentación
  let perfil, tema, nivel, cantidad;

  // ==============================
  // 2. FUNCIONES UTILITARIAS
  // ==============================
  function formatInline(text) {
    let html = text;
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"); // **negrita**
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");             // *cursiva*
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");         // `codigo`
    return html;
  }

  function addMessage(text, from = "bot", isHTML = false) {
    const div = document.createElement("div");
    div.className = "msg " + from;
    div.innerHTML = isHTML ? text : formatInline(text).replace(/\n/g, "<br>");
    messages.appendChild(div);

    // 🔽 Auto scroll suave
    setTimeout(() => {
      messages.scrollTo({
        top: messages.scrollHeight,
        behavior: "smooth"
      });
    }, 50);
  }

  function formatTaller(text) {
    let html = text;

    // ====== Estilos tipo Markdown ======
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // ====== Listas ======
    html = html.replace(/^- (.*?)(\n|$)/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
    html = html.replace(/^\d+\.\s(.*?)(\n|$)/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/gs, "<ol>$1</ol>");

    // ====== Párrafos ======
    html = html.replace(/\n\n+/g, "</p><p>");
    html = "<p>" + html + "</p>";

    return html;
  }

  // ==============================
  // 3. FLUJO DE CONVERSACIÓN
  // ==============================
  function nextStep(answer) {
    const lower = answer.toLowerCase();

    if (step === -2) {
      addMessage("¡Qué gusto saludarte! 😊");
      addMessage("Dime, ¿cómo estás hoy?");
    } else if (step === -1) {
      addMessage("¡Me alegra saberlo! 🙌");
      addMessage("Ahora te ayudaré a crear un taller inclusivo.");
      addMessage("Primero dime: ¿qué discapacidad tiene el estudiante?");
    } else if (step === 0) {
      perfil = answer;
      addMessage("Perfecto. ¿Cuál es el área o tema del taller?");
    } else if (step === 1) {
      tema = answer;
      addMessage("Genial. ¿Qué nivel? (primaria, secundaria o bachillerato)");
    } else if (step === 2) {
      nivel = answer;
      addMessage("¿Cuántos ejercicios quieres?");
    } else if (step === 3) {
      cantidad = answer;
      addMessage("⏳ Generando tu taller, dame un momento...");
      generarTaller();
      return;
    } else if (step === 4) {
      // Preguntar si quiere otro taller
      if (lower.includes("mismo") || lower.includes("repite") || lower.includes("no me gustó")) {
        addMessage("Entendido, generando otro taller con los mismos datos...");
        generarTaller();
        return;
      } else if (lower.startsWith("s")) {
        addMessage("Perfecto 🙌. Vamos a empezar de nuevo.");
        step = -1;
        addMessage("¿Qué discapacidad tiene el estudiante?");
        return; // 👈 evita que se ejecute step++
      } else if (lower.startsWith("n")) {
        addMessage("Gracias por usar **LUDIK** 💜. ¡Hasta la próxima!");
        step = 99;
        return; // 👈 evita que se ejecute step++
      } else {
        addMessage("Perdón, no entendí. ¿Quieres otro taller? (sí / no / con los mismos datos)");
        return; // 👈 evita que se ejecute step++
      }
    }

    step++;
  }

  // ==============================
  // 4. GENERAR TALLER
  // ==============================
  async function generarTaller() {
    try {
      const res = await fetch("/api/generar-taller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfil, tema, nivel, cantidad })
      });
      const data = await res.json();
      if (data.error) {
        addMessage("❌ Error: " + data.error);
      } else {
        const organizado = formatTaller(data.taller);
        addMessage("✅ Taller generado:", "bot");
        addMessage(organizado, "bot", true);

        // Preguntar si quiere otro
        addMessage("¿Quieres que genere otro taller? (sí / no / con los mismos datos)");
        step = 4;
      }
    } catch (err) {
      addMessage("❌ Error de conexión: " + err.message);
    }
  }

  // ==============================
  // 5. EVENTOS
  // ==============================
  send.addEventListener("click", () => {
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, "user");
    nextStep(text);
    input.value = "";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send.click();
  });

  // ==============================
  // 6. INICIO DEL CHAT
  // ==============================
  addMessage("👋 Hola, bienvenido a **LUDIK**.");
  addMessage("Mi nombre es **Nubbi**, tu asistente para crear talleres inclusivos.");
});
