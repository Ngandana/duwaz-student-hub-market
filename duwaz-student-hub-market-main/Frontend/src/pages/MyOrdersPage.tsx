import { useState } from 'react';
import { Package, Navigation } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '@/services/api';
import { getStatusBadge, canCustomerCancel } from '@/lib/orderUtils';
import type { Order, OrderStatus } from '@/types';

const MyOrdersPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', 'my'],
    queryFn: ordersApi.getMyOrders,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => ordersApi.cancelOrder(id, 'Cancelled by customer'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'my'] });
      toast({ title: 'Order cancelled' });
      setCancelOrderId(null);
    },
    onError: (err: any) => toast({ title: 'Failed to cancel', description: err.message, variant: 'destructive' }),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold mb-2">No orders yet</h2>
          <p className="text-gray-500">When you place orders, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const { label, className } = getStatusBadge(order.status);
            const showCancel = canCustomerCancel(order.status as OrderStatus);
            // Show Track for any order that isn't fully terminal
            const isTrackable = !['CANCELLED', 'REFUNDED'].includes(order.status);
            const isActive = ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(order.status);
            return (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Order #{order.id}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {isActive && (
                        <span className="flex items-center gap-1 text-xs text-duwaz-brown font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-duwaz-brown animate-ping" />
                          Active · ETA ≤ 10 min
                        </span>
                      )}
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${className}`}>
                        {label}
                      </span>
                      {isTrackable && (
                        <Button
                          size="sm"
                          className={`h-7 text-xs text-white ${isActive ? 'bg-duwaz-brown hover:bg-duwaz-brown/90 ring-2 ring-duwaz-brown/30 ring-offset-1' : 'bg-duwaz-brown/70 hover:bg-duwaz-brown/90'}`}
                          onClick={() => navigate(`/order/${order.id}/track`)}
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          {isActive ? 'Track Live' : 'Track'}
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.orderDate).toLocaleDateString('en-ZA', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                    {order.business && ` · ${order.business.businessName}`}
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.product?.name ?? 'Product'} × {item.quantity}
                          </span>
                          <span className="font-medium">
                            R{Number(item.unitPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t pt-3">
                    <div>
                      <p className="font-bold">Total: R{Number(order.totalAmount).toFixed(2)}</p>
                      {order.cancellationReason && (
                        <p className="text-sm text-red-600 mt-1">
                          Reason: {order.cancellationReason}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {showCancel && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-700 border-red-200"
                          onClick={() => setCancelOrderId(order.id)}
                        >
                          Cancel Order
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!cancelOrderId} onOpenChange={(o) => !o && setCancelOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order #{cancelOrderId}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your order will be cancelled immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => cancelOrderId && cancelMutation.mutate(cancelOrderId)}
            >
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyOrdersPage;
