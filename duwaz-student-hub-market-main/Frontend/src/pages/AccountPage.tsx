import { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload, X, Navigation, TrendingUp, Star, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStudent, useUpdateStudent } from '@/hooks/useStudents';
import { useQuery } from '@tanstack/react-query';
import { ordersApi, transactionsApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getStatusBadge } from '@/lib/orderUtils';

const AccountPage = () => {
  const { toast } = useToast();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const CURRENT_STUDENT_ID = user?.userId ?? 0;
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: student, isLoading: studentLoading } = useStudent(CURRENT_STUDENT_ID);
  const { mutate: updateStudent, isPending: isSaving } = useUpdateStudent();

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'my'],
    queryFn: ordersApi.getMyOrders,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['transactions', 'summary'],
    queryFn: () => transactionsApi.getMySummary(),
    staleTime: 30000,
  });

  const transactions = (summary as any)?.transactions ?? [];
  const rewardHistory = (summary as any)?.rewardHistory ?? [];
  const totalSpend    = Number((summary as any)?.totalSpend ?? 0);
  const totalPoints   = Number((summary as any)?.totalPoints ?? 0);
  const pointsValue   = Number((summary as any)?.pointsValue ?? 0);

  const [editForm, setEditForm] = useState({
    studentName: '',
    studentNumber: '',
    locationAddress: '',
    profileImage: null as string | null,
  });

  const handleEditClick = () => {
    if (student) {
      setEditForm({
        studentName:     student.studentName ?? '',
        studentNumber:   student.studentNumber ?? '',
        locationAddress: student.locationAddress ?? '',
        profileImage:    student.profileImage ?? null,
      });
    }
    setIsEditing(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Image must be smaller than 2MB', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm(prev => ({ ...prev, profileImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setEditForm(prev => ({ ...prev, profileImage: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveProfile = () => {
    if (!student) return;
    updateStudent(
      {
        ...student,
        studentName:     editForm.studentName,
        studentNumber:   editForm.studentNumber,
        locationAddress: editForm.locationAddress,
        profileImage:    editForm.profileImage ?? undefined,
      } as any,
      {
        onSuccess: (saved) => {
          setIsEditing(false);
          // Push profileImage (and name) into AuthContext so Navbar updates instantly
          updateUser({
            studentName: saved.studentName ?? user?.studentName,
            profileImage: (saved as any).profileImage ?? undefined,
          });
          toast({ title: 'Profile updated', description: 'Your profile has been saved.' });
        },
        onError: (err) => {
          toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
        },
      }
    );
  };

  const initials = student?.studentName
    ? student.studentName.split(' ').map((n) => n[0]).join('').toUpperCase()
    : '?';

  // Current profile picture — in edit mode show preview, otherwise show saved
  const displayImage = isEditing ? editForm.profileImage : student?.profileImage;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Account</h1>

      <div className="flex flex-col md:flex-row gap-8">

        {/* ── Summary Card ── */}
        <Card className="md:w-1/3">
          <CardHeader>
            {/* Avatar with camera overlay */}
            <div className="flex justify-center mb-4">
              <div className="relative group">
                <Avatar className="h-24 w-24 ring-2 ring-duwaz-brown/20">
                  {displayImage && <AvatarImage src={displayImage} alt={student?.studentName} className="object-cover" />}
                  <AvatarFallback className="text-2xl bg-duwaz-brown text-white">
                    {studentLoading ? '...' : initials}
                  </AvatarFallback>
                </Avatar>

                {/* Camera button — always visible, opens file picker and auto-enters edit mode */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isEditing) handleEditClick();
                    setTimeout(() => fileInputRef.current?.click(), 50);
                  }}
                  className="absolute bottom-0 right-0 bg-duwaz-brown text-white rounded-full p-1.5 shadow hover:bg-duwaz-brown/80 transition-colors"
                  aria-label="Change profile picture"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <CardTitle className="text-center">
              {studentLoading ? 'Loading...' : (student?.studentName ?? 'Student')}
            </CardTitle>
            <CardDescription className="text-center">
              {student?.studentNumber ?? ''}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orders</span>
                <span>{orders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Spent</span>
                <span className="font-semibold text-duwaz-brown">R{totalSpend.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loyalty Points</span>
                <span className="font-semibold text-amber-600">⭐ {totalPoints} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Points Value</span>
                <span className="font-semibold text-green-600">R{pointsValue.toFixed(2)}</span>
              </div>
              {student?.locationAddress && (
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground text-xs">Location</p>
                  <p className="text-sm font-medium">{student.locationAddress}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />

        {/* ── Tabs ── */}
        <div className="flex-1">
          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
            </TabsList>

            {/* ── Profile tab ── */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your name, student number, location and profile picture.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {studentLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-200 animate-pulse rounded" />)}
                    </div>
                  ) : (
                    <>
                      {/* Profile picture section */}
                      {isEditing && (
                        <div>
                          <Label className="mb-2 block">Profile Picture</Label>
                          <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 flex-shrink-0">
                              {editForm.profileImage ? (
                                <>
                                  <img
                                    src={editForm.profileImage}
                                    alt="Preview"
                                    className="w-20 h-20 rounded-full object-cover border-2 border-duwaz-brown"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </>
                              ) : (
                                <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-2xl font-bold text-gray-400">
                                  {initials}
                                </div>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-gray-500">
                              <p>Max 2MB — JPG, PNG or WebP.</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Upload className="h-3.5 w-3.5 mr-1.5" />
                                {editForm.profileImage ? 'Change Photo' : 'Upload Photo'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Full Name */}
                      <div className="space-y-1">
                        <Label htmlFor="studentName">Full Name</Label>
                        <Input
                          id="studentName"
                          value={isEditing ? editForm.studentName : (student?.studentName ?? '')}
                          onChange={(e) => setEditForm(p => ({ ...p, studentName: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>

                      {/* Student Number */}
                      <div className="space-y-1">
                        <Label htmlFor="studentNumber">Student Number</Label>
                        <Input
                          id="studentNumber"
                          value={isEditing ? editForm.studentNumber : (student?.studentNumber ?? '')}
                          onChange={(e) => setEditForm(p => ({ ...p, studentNumber: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>

                      {/* Location Address */}
                      <div className="space-y-1">
                        <Label htmlFor="locationAddress">Location Address</Label>
                        <Input
                          id="locationAddress"
                          placeholder="e.g. Room 204, Res Block B"
                          value={isEditing ? editForm.locationAddress : (student?.locationAddress ?? '')}
                          onChange={(e) => setEditForm(p => ({ ...p, locationAddress: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  {isEditing ? (
                    <div className="flex gap-2 w-full">
                      <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 bg-duwaz-brown hover:bg-duwaz-brown/90"
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  ) : (
                    <Button className="w-full" onClick={handleEditClick} disabled={!student}>
                      Edit Profile
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>

            {/* ── Orders ── */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>Your placed orders.</CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-20 bg-gray-200 animate-pulse rounded" />
                      ))}
                    </div>
                  ) : orders.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No orders yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const { label, className } = getStatusBadge(order.status);
                        const isTrackable = !['CANCELLED', 'REFUNDED'].includes(order.status);
                        const isActive = ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(order.status);
                        return (
                          <div key={order.id} className="border rounded-md p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">Order #{order.id}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(order.orderDate).toLocaleDateString()}
                                  {order.business && ` · ${order.business.businessName}`}
                                </p>
                              </div>
                              {/* Status badge + Track button side by side */}
                              <div className="flex items-center gap-2 flex-wrap justify-end">
                                {isActive && (
                                  <span className="flex items-center gap-1 text-xs text-duwaz-brown font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-duwaz-brown animate-ping" />
                                    Live
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
                            <p className="text-sm">Total: R{Number(order.totalAmount).toFixed(2)}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Transactions ── */}
            <TabsContent value="transactions">
              <div className="space-y-4">
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="pt-4 pb-3 text-center">
                      <Receipt className="h-5 w-5 mx-auto mb-1 text-duwaz-brown" />
                      <p className="text-2xl font-bold text-duwaz-brown">R{totalSpend.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Total Spent</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3 text-center">
                      <Star className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                      <p className="text-2xl font-bold text-amber-600">{totalPoints}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Loyalty Points</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-3 text-center">
                      <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
                      <p className="text-2xl font-bold text-green-600">R{pointsValue.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Points Value</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Transaction list */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Payment History</CardTitle>
                    <CardDescription>Auto-recorded when each order is delivered.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {summaryLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />
                        ))}
                      </div>
                    ) : transactions.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No transactions yet — complete your first order!</p>
                    ) : (
                      <div className="space-y-3">
                        {transactions.map((tx: any) => (
                          <div key={tx.id ?? tx.transactionId} className="flex justify-between items-center py-3 border-b last:border-0">
                            <div>
                              <p className="font-medium text-sm">
                                {tx.order ? `Order #${tx.order.id ?? tx.orderId}` : (tx.product?.name ?? `Transaction #${tx.id ?? tx.transactionId}`)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(tx.transactionDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-duwaz-brown">R{Number(tx.amount).toFixed(2)}</p>
                              <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                                {tx.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Rewards ── */}
            <TabsContent value="rewards">
              <div className="space-y-4">
                {/* Points balance card */}
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Star className="h-7 w-7 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-3xl font-black text-amber-600">{totalPoints} pts</p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          Worth <span className="font-semibold text-green-600">R{pointsValue.toFixed(2)}</span> · 100 pts = R10
                        </p>
                        {/* Progress bar toward next 100 pts */}
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{totalPoints % 100} / 100 pts to next reward</span>
                            <span>{100 - (totalPoints % 100)} pts away</span>
                          </div>
                          <div className="w-full bg-amber-100 rounded-full h-2">
                            <div
                              className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${totalPoints % 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 border-t border-amber-200 pt-3">
                      You earn <strong>1 point per R1 spent</strong> on every delivered order. Points can be redeemed at checkout.
                    </p>
                  </CardContent>
                </Card>

                {/* How it works */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-duwaz-brown" />
                      How Loyalty Points Work
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { step: '1', label: 'Place & receive an order', icon: '🛍️' },
                        { step: '2', label: '1% of spend becomes points', icon: '⭐' },
                        { step: '3', label: 'Redeem 100 pts = R10 off', icon: '🎁' },
                      ].map(s => (
                        <div key={s.step} className="bg-gray-50 rounded-lg p-3">
                          <div className="text-2xl mb-1">{s.icon}</div>
                          <p className="text-xs text-gray-600">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Earned history */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Points History</CardTitle>
                    <CardDescription>Points earned from each delivered order.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {summaryLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-12 bg-gray-200 animate-pulse rounded" />
                        ))}
                      </div>
                    ) : rewardHistory.length === 0 ? (
                      <p className="text-gray-500 text-center py-6">No points earned yet — complete an order to start earning!</p>
                    ) : (
                      <div className="space-y-2">
                        {rewardHistory.map((r: any) => (
                          <div key={r.id} className="flex justify-between items-center py-2 border-b last:border-0">
                            <div>
                              <p className="text-sm font-medium">{r.description ?? `Order #${r.order?.id}`}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(r.earnedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {' · '}R{Number(r.orderAmount).toFixed(2)} order
                              </p>
                            </div>
                            <span className="text-amber-600 font-bold text-sm">+{r.pointsEarned} pts</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
