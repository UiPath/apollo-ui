import { Button } from '@uipath/apollo-wind/components';

export function App() {
  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <p className="text-h3 text-foreground-emp mb-1">Apollo Wind Demo</p>
          <p className="text-l text-foreground-de-emp">
            This page mixes raw Apollo Wind utilities with prebuilt components.
          </p>
        </header>

        <section className="card card-elevated p-6">
          <h3 className="font-semibold mb-2 text-foreground-emp">Pure utility example</h3>
          <p className="text-foreground-de-emp">
            This card uses the legacy semantic utilities (
            <code className="text-primary">card card-elevated</code>) exported by{' '}
            <code className="text-primary">@uipath/apollo-wind-css</code>.
          </p>
        </section>

        <section className="card p-6 space-y-4">
          <header>
            <h3 className="text-h4 text-foreground-emp mb-1">UI component example</h3>
            <p className="text-foreground-de-emp">
              Buttons below are rendered via @uipath/apollo-wind-ui.
            </p>
          </header>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => alert('UI button')}>UI Button</Button>
            <Button variant="outline" onClick={() => alert('Outline clicked!')}>
              Outline
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
