import { Button } from "@/registry/button/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/card/card";

export function MyTemplate() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Template</CardTitle>
            </CardHeader>
            <CardContent>
                <Button>Click me</Button>
            </CardContent>
        </Card>
    );
}
