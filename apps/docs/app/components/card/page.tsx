'use client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button } from 'indas-ui'
import { Preview } from '../../../components/preview'

export default function CardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Card</h1>
      <p className="text-[rgb(var(--fg-muted))] mb-8">
        Container with header, content, and footer slots.
      </p>

      <h2 className="text-xl font-semibold mb-3 mt-8">Basic</h2>
      <Preview
        code={`<Card className="w-80">
  <CardHeader>
    <CardTitle>Project Estimate</CardTitle>
    <CardDescription>Q3 2026 cost projection</CardDescription>
  </CardHeader>
  <CardContent>
    Total estimated cost across materials, labor, and overhead.
  </CardContent>
  <CardFooter>
    <Button variant="primary">View Details</Button>
  </CardFooter>
</Card>`}
      >
        <Card className="w-80">
          <CardHeader>
            <CardTitle>Project Estimate</CardTitle>
            <CardDescription>Q3 2026 cost projection</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-[rgb(var(--fg-muted))]">
            Total estimated cost across materials, labor, and overhead.
          </CardContent>
          <CardFooter>
            <Button variant="primary">View Details</Button>
          </CardFooter>
        </Card>
      </Preview>
    </div>
  )
}
