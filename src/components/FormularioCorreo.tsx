import { createSignal } from 'solid-js';

export default function FormularioCorreo() {
  const [status, setStatus] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));

    const res = await fetch('/functions/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer TU_API_KEY'
      },
      body: JSON.stringify({
        emails: data.to.split(',').map((e) => e.trim()),
        subject: data.subject,
        content: data.text
      }),
    });

    const result = await res.json();
    setStatus(result.message || result.error);
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea name="to" placeholder="Correos separados por coma" required />
      <input name="subject" placeholder="Asunto" required />
      <textarea name="text" placeholder="Mensaje" required />
      <button type="submit">Enviar</button>
      <p>{status()}</p>
    </form>
  );
}
