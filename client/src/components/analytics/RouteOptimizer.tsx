import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Route, TrendingUp } from "lucide-react";

/**
 * Result of an AI route optimization operation.
 */
interface RouteOptimizationResult {
  optimizedOrder: string[];
  originalDistance: number;
  optimizedDistance: number;
  timeSaved: number;
  fuelSaved: number;
  suggestions: string[];
}

/**
 * Represents a delivery route.
 */
interface Route {
  id: string;
  name: string;
  status: string;
}

/**
 * RouteOptimizer component allows users to optimize delivery routes using AI.
 * It fetches available routes, lets the user select one, and triggers optimization.
 */
export function RouteOptimizer(): JSX.Element {
  const [selectedRoute, setSelectedRoute] = useState<string>("");
  const { toast } = useToast();

  const {
    data: routes,
    isLoading: routesLoading,
    isError: routesError,
    error: routesErrorObj
  } = useQuery<Route[]>({
    queryKey: ["/api/routes"],
  });

  const optimizeMutation = useMutation<RouteOptimizationResult, unknown, string>({
    mutationFn: async (routeId: string) => {
      const response = await apiRequest("POST", `/api/analytics/optimize-route/${routeId}`);
      return response.json();
    },
    onSuccess: (data: RouteOptimizationResult) => {
      toast({
        title: "Route Optimized",
        description: `Saved ${data.timeSaved} minutes and ${data.fuelSaved}L of fuel`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/route-optimizations"] });
    },
    onError: () => {
      toast({ title: "Optimization Failed", variant: "destructive" });
    },
  });

  const { data: optimizationHistory } = useQuery<RouteOptimizationResult[]>({
    queryKey: ["/api/analytics/route-optimizations"],
  });

  return (
    <div className="space-y-6" role="region" aria-label="AI Route Optimization">
      <Card tabIndex={0} aria-labelledby="route-optimizer-title">
        <CardHeader>
          <CardTitle id="route-optimizer-title" className="flex items-center gap-2">
            <Route className="h-5 w-5" aria-hidden="true" />
            AI Route Optimization
          </CardTitle>
          <CardDescription>
            Optimize delivery routes using AI to reduce travel time and fuel costs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {routesLoading && (
            <div className="text-sm text-muted-foreground">Loading routes...</div>
          )}
          {routesError && (
            <div className="text-sm text-red-500">Error loading routes: {String(routesErrorObj)}</div>
          )}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedRoute} onValueChange={setSelectedRoute}>
              <SelectTrigger className="w-64" data-testid="select-route" aria-label="Select route to optimize">
                <SelectValue placeholder="Select a route to optimize" />
              </SelectTrigger>
              <SelectContent>
                {routesLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  routes?.map((route) => (
                    <SelectItem key={route.id} value={route.id} aria-label={`Route ${route.name} (${route.status})`}>
                      {route.name} ({route.status})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              onClick={() => selectedRoute && optimizeMutation.mutate(selectedRoute)}
              disabled={!selectedRoute || optimizeMutation.isPending}
              data-testid="button-optimize-route"
              aria-busy={optimizeMutation.isPending}
              aria-label="Optimize selected route"
            >
              {optimizeMutation.isPending ? (
                <>Optimizing...</>
              ) : (
                <>Optimize</>
              )}
            </Button>
          </div>
          {optimizeMutation.isError && (
            <div className="text-sm text-red-500 mt-2">Error optimizing route. Please try again.</div>
          )}
        </CardContent>
      </Card>
      {/* Optimization history and other UI can be added here */}
    </div>
  );
}
