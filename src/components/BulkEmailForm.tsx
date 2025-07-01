import { createSignal, createMemo } from 'solid-js';

interface EmailStatus {
  type: 'success' | 'error' | 'warning' | '';
  message: string;
}

interface EmailStats {
  total: number;
  valid: number;
  invalid: number;
  invalidList: string[];
}

const BulkEmailForm = () => {
  const [subject, setSubject] = createSignal('');
  const [body, setBody] = createSignal('');
  const [emails, setEmails] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);
  const [status, setStatus] = createSignal<EmailStatus>({ type: '', message: '' });

  // Computed email stats with validation
  const emailStats = createMemo((): EmailStats => {
    const emailList = emails().split(/[,\n]/).map(e => e.trim()).filter(e => e.length > 0);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = emailList.filter(email => emailRegex.test(email));
    const invalidEmails = emailList.filter(email => email && !emailRegex.test(email));
    
    return {
      total: emailList.length,
      valid: validEmails.length,
      invalid: invalidEmails.length,
      invalidList: invalidEmails
    };
  });

  const validateForm = (): boolean => {
    if (!subject().trim()) {
      setStatus({ type: 'error', message: 'El asunto es obligatorio' });
      return false;
    }
    if (!body().trim()) {
      setStatus({ type: 'error', message: 'El mensaje es obligatorio' });
      return false;
    }
    if (!emails().trim()) {
      setStatus({ type: 'error', message: 'Debe agregar al menos un email' });
      return false;
    }
    if (emailStats().invalid > 0) {
      setStatus({ 
        type: 'error', 
        message: `${emailStats().invalid} emails inválidos encontrados. Revisa el formato.` 
      });
      return false;
    }
    if (emailStats().valid === 0) {
      setStatus({ type: 'error', message: 'No se encontraron emails válidos' });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setStatus({ type: '', message: '' });

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const emailList = emails()
        .split(/[,\n]/)
        .map(email => email.trim())
        .filter(email => email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

      const payload = {
        subject: subject().trim(),
        body: body().trim(),
        emails: emailList
      };

      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ${env.API_KEY}',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        setStatus({ 
          type: 'success', 
          message: `¡Correos enviados exitosamente! Se enviaron ${emailStats().valid} correos.` 
        });
        
        // Clear form after success
        setTimeout(() => {
          setSubject('');
          setBody('');
          setEmails('');
          setStatus({ type: '', message: '' });
        }, 3000);
      } else {
        setStatus({ 
          type: 'error', 
          message: result.message || 'Error al enviar los correos' 
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus({ 
        type: 'error', 
        message: 'Error de conexión. Verifica tu conexión a internet.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const emailsFromFile = content
          .split(/[\n,]/)
          .map(email => email.trim())
          .filter(email => email.length > 0)
          .join(', ');
        setEmails(emailsFromFile);
      };
      reader.readAsText(file);
    } else {
      setStatus({ type: 'error', message: 'Por favor selecciona un archivo .txt válido' });
    }
  };

  const getStatusIcon = () => {
    switch (status().type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '';
    }
  };

  const getStatusColors = () => {
    switch (status().type) {
      case 'success': return 'bg-green-50 border-green-400 text-green-800';
      case 'error': return 'bg-red-50 border-red-400 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-400 text-yellow-800';
      default: return '';
    }
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div class="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div class="text-center mb-12">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6 shadow-lg">
            <span class="text-white text-3xl">📧</span>
          </div>
          <h1 class="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Correo Masivo Pro
          </h1>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Envía campañas de email profesionales de forma rápida, segura y eficiente
          </p>
        </div>

        {/* Features Grid */}
        <div class="grid md:grid-cols-4 gap-6 mb-16">
          <div class="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
            <span class="text-4xl mb-4 block group-hover:scale-110 transition-transform duration-300">⚡</span>
            <h3 class="font-bold text-gray-800 mb-3 text-lg">Envío Rápido</h3>
            <p class="text-gray-600">Miles de correos en segundos</p>
          </div>
          <div class="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
            <span class="text-4xl mb-4 block group-hover:scale-110 transition-transform duration-300">🔒</span>
            <h3 class="font-bold text-gray-800 mb-3 text-lg">100% Seguro</h3>
            <p class="text-gray-600">Datos encriptados y protegidos</p>
          </div>
          <div class="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
            <span class="text-4xl mb-4 block group-hover:scale-110 transition-transform duration-300">👥</span>
            <h3 class="font-bold text-gray-800 mb-3 text-lg">Lista Inteligente</h3>
            <p class="text-gray-600">Validación automática de emails</p>
          </div>
          <div class="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
            <span class="text-4xl mb-4 block group-hover:scale-110 transition-transform duration-300">📄</span>
            <h3 class="font-bold text-gray-800 mb-3 text-lg">HTML Support</h3>
            <p class="text-gray-600">Formato rico y personalizable</p>
          </div>
        </div>

        {/* Main Form */}
        <div class="max-w-5xl mx-auto">
          <div class="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
            <div class="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-10 py-8">
              <h2 class="text-3xl font-bold text-white flex items-center gap-4">
                <span class="text-4xl">🚀</span>
                Crear Nueva Campaña
              </h2>
              <p class="text-blue-100 mt-3 text-lg">Completa los campos y envía tu campaña en minutos</p>
            </div>

            <div class="p-10 space-y-10">
              {/* Status Messages */}
              {status().message && (
                <div class={`rounded-2xl p-6 border-l-8 ${getStatusColors()} animate-pulse`}>
                  <div class="flex items-center gap-4">
                    <span class="text-2xl">{getStatusIcon()}</span>
                    <p class="font-semibold text-lg">{status().message}</p>
                  </div>
                </div>
              )}

              {/* Subject Field */}
              <div class="space-y-3">
                <label for="subject" class="block text-lg font-bold text-gray-700 flex items-center gap-2">
                  <span>📧</span> Asunto del correo
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject()}
                  onInput={(e) => setSubject(e.target.value)}
                  placeholder="Ej: Newsletter de Enero 2025 - Novedades Exclusivas"
                  disabled={isLoading()}
                  class="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 disabled:bg-gray-50 disabled:cursor-not-allowed text-lg"
                />
              </div>

              {/* Body Field */}
              <div class="space-y-3">
                <label for="body" class="block text-lg font-bold text-gray-700 flex items-center gap-2">
                  <span>✍️</span> Mensaje del correo
                </label>
                <textarea
                  id="body"
                  value={body()}
                  onInput={(e) => setBody(e.target.value)}
                  rows={10}
                  placeholder="Escribe aquí el contenido de tu correo. Puedes usar HTML básico para dar formato..."
                  disabled={isLoading()}
                  class="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 disabled:bg-gray-50 disabled:cursor-not-allowed resize-none text-lg"
                />
                <p class="text-sm text-gray-500 bg-blue-50 p-3 rounded-xl">
                  💡 <strong>Tip:</strong> Puedes usar HTML básico como &lt;b&gt;, &lt;i&gt;, &lt;br&gt;, &lt;a&gt; para dar formato
                </p>
              </div>

              {/* Emails Field */}
              <div class="space-y-4">
                <div class="flex flex-wrap justify-between items-center gap-4">
                  <label for="emails" class="block text-lg font-bold text-gray-700 flex items-center gap-2">
                    <span>📋</span> Lista de correos electrónicos
                  </label>
                  <div class="flex flex-wrap gap-6 text-sm">
                    <span class="bg-blue-100 px-4 py-2 rounded-full text-blue-800 font-semibold">
                      📊 Total: {emailStats().total}
                    </span>
                    <span class="bg-green-100 px-4 py-2 rounded-full text-green-800 font-semibold">
                      ✅ Válidos: {emailStats().valid}
                    </span>
                    {emailStats().invalid > 0 && (
                      <span class="bg-red-100 px-4 py-2 rounded-full text-red-800 font-semibold">
                        ❌ Inválidos: {emailStats().invalid}
                      </span>
                    )}
                  </div>
                </div>
                
                <textarea
                  id="emails"
                  value={emails()}
                  onInput={(e) => setEmails(e.target.value)}
                  rows={8}
                  placeholder="usuario1@email.com, usuario2@email.com, usuario3@email.com..."
                  disabled={isLoading()}
                  class="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 disabled:bg-gray-50 disabled:cursor-not-allowed font-mono text-base resize-none"
                />
                
                {/* File Upload */}
                <div class="flex flex-wrap items-center gap-6 pt-3">
                  <label class="flex items-center gap-3 cursor-pointer text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 px-6 py-3 rounded-xl hover:bg-blue-100">
                    <input
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      disabled={isLoading()}
                      class="hidden"
                    />
                    <span class="text-xl">📄</span>
                    <span class="font-semibold">Cargar desde archivo .txt</span>
                  </label>
                  <span class="text-gray-400 text-xl">|</span>
                  <span class="text-gray-500">Separa los emails con comas o saltos de línea</span>
                </div>

                {/* Invalid emails warning */}
                {emailStats().invalid > 0 && (
                  <div class="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
                    <p class="text-yellow-800 font-bold text-lg flex items-center gap-2">
                      <span>⚠️</span> Se encontraron {emailStats().invalid} emails con formato inválido:
                    </p>
                    <p class="text-yellow-700 mt-2 font-mono text-sm bg-yellow-100 p-3 rounded-xl">
                      {emailStats().invalidList.slice(0, 3).join(', ')}
                      {emailStats().invalidList.length > 3 && '...'}
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div class="pt-8">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading() || emailStats().valid === 0}
                  class={`
                    w-full py-6 px-8 rounded-2xl font-bold text-xl text-white transition-all duration-500 flex items-center justify-center gap-4 transform
                    ${isLoading() || emailStats().valid === 0
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 hover:scale-105 shadow-2xl hover:shadow-3xl'
                    }
                  `}
                >
                  {isLoading() ? (
                    <>
                      <div class="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enviando correos...</span>
                    </>
                  ) : (
                    <>
                      <span class="text-2xl">🚀</span>
                      <span>Enviar {emailStats().valid} correo{emailStats().valid !== 1 ? 's' : ''}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Loading Progress */}
              {isLoading() && (
                <div class="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8">
                  <div class="flex items-center gap-6">
                    <div class="flex-shrink-0">
                      <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div>
                      <p class="text-blue-800 font-bold text-xl">Procesando envío masivo...</p>
                      <p class="text-blue-600 mt-1">Esto puede tomar unos segundos dependiendo de la cantidad de correos</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Information Cards */}
          <div class="grid md:grid-cols-2 gap-8 mt-12">
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-8 shadow-lg">
              <h3 class="font-bold text-blue-800 mb-6 flex items-center gap-3 text-xl">
                <span class="text-2xl">⚡</span>
                Consejos para mejor entrega
              </h3>
              <ul class="text-blue-700 space-y-3">
                <li class="flex items-start gap-3">
                  <span class="text-blue-500 font-bold">•</span>
                  <span>Usa un asunto claro y descriptivo</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-blue-500 font-bold">•</span>
                  <span>Evita palabras como "GRATIS" o "URGENTE"</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-blue-500 font-bold">•</span>
                  <span>Incluye contenido de valor</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-blue-500 font-bold">•</span>
                  <span>Mantén un equilibrio texto/imagen</span>
                </li>
              </ul>
            </div>
            
            <div class="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-8 shadow-lg">
              <h3 class="font-bold text-green-800 mb-6 flex items-center gap-3 text-xl">
                <span class="text-2xl">🔒</span>
                Seguridad y privacidad
              </h3>
              <ul class="text-green-700 space-y-3">
                <li class="flex items-start gap-3">
                  <span class="text-green-500 font-bold">•</span>
                  <span>Todos los datos están encriptados</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-green-500 font-bold">•</span>
                  <span>No almacenamos tu lista de correos</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-green-500 font-bold">•</span>
                  <span>Cumplimiento total con GDPR</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="text-green-500 font-bold">•</span>
                  <span>Servidor seguro y confiable</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default BulkEmailForm; 