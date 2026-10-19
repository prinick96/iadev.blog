export const site = {
  title: 'IADev',
  subtitle: 'Senior por Suscripción',
  description:
    'Sátira sobre IA para programadores: vibecoders, «ingenieros de IA» y CEOs que llevan meses buscando un problema para su solución con IA.',
  // Puede que si eres vibecoder esto deba ser localhost cuando se te olvide la variable de entorno, pero espera, qué haces viendo esto si vibecodeas??
  url: process.env.SITE_URL ?? 'https://iadev.blog',
}
