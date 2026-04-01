import './style.css';

const CARDS = [
  {
    title: 'Apollo Wind',
    description:
      "UiPath's open-source design system for building consistent user experiences across all UiPath products.",
    url: 'https://apollo-wind.vercel.app/',
    iconClass: 'card__icon--wind',
    iconSvg: `<svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.41.153l-.107 2.558a.163.163 0 00.262.136l.96-.73.77.592a.163.163 0 00.262-.132L16.44 0 18.4.051a1.397 1.397 0 011.326 1.467L19.1 21.562a1.397 1.397 0 01-1.327 1.33L1.87 23.98a1.397 1.397 0 01-1.45-1.36L0 2.543A1.397 1.397 0 011.318 1.12L14.41.153zm-2.154 8.996c0 .478 3.236.248 3.67-.087 0-3.244-1.743-4.943-4.93-4.943-3.186 0-4.967 1.737-4.967 4.34 0 4.494 6.058 4.571 6.058 7.017 0 .696-.32 1.09-.99 1.09-.906 0-1.252-.462-1.214-2.036 0-.374-3.746-.49-3.86 0-.303 4.068 2.252 5.247 5.112 5.247 2.785 0 4.954-1.478 4.954-4.151 0-4.82-6.172-4.687-6.172-7.055 0-.965.735-1.09 1.138-1.09.44 0 1.24.087 1.201 1.668z" fill="currentColor"/></svg>`,
  },
  {
    title: 'Apollo Vertex',
    description:
      'The design system for verticals — tailored components, patterns, and documentation for vertical product teams.',
    url: 'https://apollo-vertex.vercel.app/',
    iconClass: 'card__icon--vertex',
    iconSvg: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 19.5h20L12 2zm0 4l6.5 11.5h-13L12 6z" fill="currentColor"/></svg>`,
  },
] as const;

function createCard(card: (typeof CARDS)[number]): string {
  return `
		<a href="${card.url}" class="card" target="_blank" rel="noopener noreferrer">
			<div class="card__icon ${card.iconClass}">${card.iconSvg}</div>
			<h2 class="card__title">${card.title}</h2>
			<p class="card__description">${card.description}</p>
			<span class="card__arrow">Visit &rarr;</span>
		</a>
	`;
}

function render(): void {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  app.innerHTML = `
		<main class="landing">
			<h1 class="landing__title">Apollo Design System</h1>
			<p class="landing__subtitle">UiPath's open-source component library</p>
			<div class="cards">
				${CARDS.map(createCard).join('')}
			</div>
		</main>
	`;
}

render();
