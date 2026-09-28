import { Button } from "@/registry/button/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/card/card";

export function MyTemplate() {
  return (
    <Card variant="solid" className="gap-6 py-6">
      <CardHeader>
        <CardTitle>My Template</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
