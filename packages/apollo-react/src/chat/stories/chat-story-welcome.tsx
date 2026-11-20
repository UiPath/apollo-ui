import React from 'react';
import { createRoot } from 'react-dom/client';

import type { AutopilotChatConfiguration, AutopilotChatService } from '../service';

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 12,
  color: 'var(--color-foreground-de-emp, var(--color-foreground))',
};

const inputStyle: React.CSSProperties = {
  padding: '6px 8px',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  background: 'var(--color-background)',
  color: 'var(--color-foreground)',
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  padding: '6px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  background: 'transparent',
  color: 'var(--color-foreground)',
  fontSize: 14,
  cursor: 'pointer',
};

function StoryWelcomeForm({
  service,
  display,
}: {
  service: AutopilotChatService;
  display: number;
}) {
  const [inputs, setInputs] = React.useState<{ customer: string; region: string }>();

  if (inputs) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
        <span>
          Inputs saved: {inputs.customer}, {inputs.region}. The composer is unlocked.
        </span>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            setInputs(undefined);
            service.setComposerLocked(true);
          }}
        >
          Edit inputs
        </button>
      </div>
    );
  }

  return (
    <form
      aria-label="Agent inputs"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: 16,
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        fontSize: 14,
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setInputs({ customer: String(data.get('customer')), region: String(data.get('region')) });
        service.setComposerLocked(false);
      }}
    >
      <span>
        A React root mounted by the host into the welcome content container (display {display}).
        Submitting unlocks the composer.
      </span>
      <label style={fieldStyle}>
        Customer
        <input name="customer" required defaultValue="" style={inputStyle} />
      </label>
      <label style={fieldStyle}>
        Region
        <select name="region" defaultValue="EMEA" style={inputStyle}>
          <option>EMEA</option>
          <option>Americas</option>
          <option>APAC</option>
        </select>
      </label>
      <button type="submit" style={buttonStyle}>
        Start
      </button>
    </form>
  );
}

/**
 * A `welcomeContent` that mounts a React root with a small inputs form, as a host with required
 * agent inputs would. The root is unmounted from the cleanup the chat calls before it empties
 * the container. `getService` is read on render, so the renderer can be created with the
 * service's configuration.
 */
export function createStoryWelcomeContent(
  getService: () => AutopilotChatService
): NonNullable<AutopilotChatConfiguration['welcomeContent']> {
  let displays = 0;

  return (container) => {
    displays += 1;
    const host = document.createElement('div');
    container.appendChild(host);
    const root = createRoot(host);
    root.render(<StoryWelcomeForm service={getService()} display={displays} />);
    return () => root.unmount();
  };
}
