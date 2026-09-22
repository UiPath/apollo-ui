import { Button } from "@uipath/apollo-vertex";
import { Card, CardContent, CardHeader, CardTitle } from "@uipath/apollo-vertex";

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
