import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { MapPin, BatteryCharging, Calendar as CalendarIcon, Clock, X, Car } from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyDak11SQl1vpb2hs8FjRHQDlOQEwKzYi08",
  authDomain: "u-di-ber.firebaseapp.com",
  projectId: "u-di-ber",
  storageBucket: "u-di-ber.firebasestorage.app",
  messagingSenderId: "349079406952",
  appId: "1:349079406952:web:6b4ea0e42538809c022edd",
  measurementId: "G-E760K8KDDJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CARS = [
  { id: 'c1', name: 'גילי תכלת', type: 'חשמלי', insurance: 'מעל 24', fuelPriority: 2 },
  { id: 'c2', name: 'גילי אדומה', type: 'חשמלי', insurance: 'מעל 24', fuelPriority: 2 },
  { id: 'c3', name: 'אמישראגז לבן', type: 'דלקן', insurance: 'כולם', fuelPriority: 1 },
  { id: 'c4', name: 'ואן', type: 'דלק יקר', insurance: 'אודי ושמוליק', fuelPriority: 4 },
  { id: 'c5', name: 'צ׳נגן', type: 'חשמלי', insurance: 'כולם', fuelPriority: 2 },
  { id: 'c6', name: 'יונדאי כחולה', type: 'היברידי', insurance: 'לפי שם', fuelPriority: 3 },
  { id: 'c7', name: 'סובארו שחורה', type: 'בנזין', insurance: 'לפי שם', fuelPriority: 3 },
  { id: 'c8', name: 'גילי שחורה', type: 'חשמלי', insurance: 'מעל 40', fuelPriority: 2 }
];

const DRIVERS = ['אודי', 'אורית', 'רותם', 'עדי', 'מעין', 'חן', 'תמי', 'לביא', 'גילי', 'סבא וסבתא', 'שמוליק'];
const LOCATIONS = ['חניה אודי 1', 'חניה אודי 2', 'חניה תמי 1', 'חניה תמי 2', 'חניה סבא', 'בסיס גילי', 'אחר'];
const CHARGING_STATIONS = ['אודי 1', 'אודי 2', 'תמי', 'סבא'];

export default function App() {
  const [activeTab, setActiveTab] = useState('status');
  const [bookings, setBookings] = useState([]);
  const [carsState, setCarsState] = useState({});
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [newBooking, setNewBooking] = useState({ carId: 'c1', driver: 'אודי', type: 'once', day: '0', startTime: '08:00', endTime: '10:00' });

  useEffect(() => {
    const unsubBookings = onSnapshot(collection(db, 'bookings'), (snap) => {
      setBookings(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubCars = onSnapshot(collection(db, 'carsState'), (snap) => {
      const stateMap = {};
      snap.docs.forEach(doc => { stateMap[doc.id] = doc.data(); });
      setCarsState(stateMap);
    });
    return () => { unsubBookings(); unsubCars(); };
  }, []);

  const handleUpdateParking = async (carId, location, isCharging) => {
    await setDoc(doc(db, 'carsState', carId), { location, isCharging }, { merge: true });
  };

  const handleAddBooking = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'bookings'), { ...newBooking, exceptions: [] });
    setIsBookingModalOpen(false);
  };

  const handleCancelBooking = async (bookingId, isRecurring, dateStr) => {
    if (!isRecurring) {
      await deleteDoc(doc(db, 'bookings', bookingId));
    } else {
      const booking = bookings.find(b => b.id === bookingId);
      await updateDoc(doc(db, 'bookings', bookingId), {
        exceptions: [...(booking.exceptions || []), dateStr]
      });
    }
  };

  const getDayName = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('he-IL', { weekday: 'long', month: 'numeric', day: 'numeric' });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-4 font-sans text-right">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        
        {/* Header Tabs */}
        <div className="flex border-b">
          <button 
            className={`flex-1 p-4 font-bold ${activeTab === 'status' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('status')}
          >
            מצב רכבים נוכחי
          </button>
          <button 
            className={`flex-1 p-4 font-bold ${activeTab === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setActiveTab('calendar')}
          >
            יומן שבועי
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'status' && (
            <div className="space-y-4">
              <button 
                onClick={() => setIsBookingModalOpen(true)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-md mb-6"
              >
                + שריון רכב חדש (נסיעה)
              </button>

              <div className="grid gap-4 md:grid-cols-2">
                {CARS.map(car => {
                  const state = carsState[car.id] || { location: 'לא ידוע', isCharging: false };
                  return (
                    <div key={car.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-lg flex items-center gap-2">
                          <Car size={20} className="text-gray-600"/> {car.name}
                        </div>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{car.type}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-4">
                        ביטוח: {car.insurance}
                      </div>

                      <div className="bg-gray-50 p-3 rounded-md space-y-2 mt-auto">
                        <div className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-1"><MapPin size={16}/> חניה:</span>
                          <select 
                            className="bg-transparent font-medium border-b border-dashed outline-none"
                            value={state.location}
                            onChange={(e) => handleUpdateParking(car.id, e.target.value, state.isCharging)}
                          >
                            <option value="לא ידוע">לא ידוע</option>
                            {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                          </select>
                        </div>
                        {car.type === 'חשמלי' && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1"><BatteryCharging size={16}/> בטעינה:</span>
                            <input 
                              type="checkbox" 
                              checked={state.isCharging}
                              onChange={(e) => handleUpdateParking(car.id, state.location, e.target.checked)}
                              className="w-4 h-4"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-6">
              {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + offset);
                const dayStr = targetDate.toISOString().split('T')[0];
                const dayIndex = targetDate.getDay().toString();

                const dayBookings = bookings.filter(b => {
                  if (b.exceptions && b.exceptions.includes(dayStr)) return false;
                  if (b.type === 'once' && b.date === dayStr) return true;
                  if (b.type === 'recurring' && b.day === dayIndex) return true;
                  return false;
                }).sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <div key={offset} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 p-3 font-bold text-gray-800 flex items-center gap-2">
                      <CalendarIcon size={18} /> {getDayName(offset)}
                    </div>
                    <div className="p-3 bg-white space-y-2">
                      {dayBookings.length === 0 ? (
                        <p className="text-sm text-gray-400">אין נסיעות משוריינות</p>
                      ) : (
                        dayBookings.map(b => {
                          const car = CARS.find(c => c.id === b.carId);
                          return (
                            <div key={b.id} className="flex justify-between items-center bg-blue-50 p-2 rounded-md text-sm border border-blue-100">
                              <div>
                                <span className="font-bold text-blue-800">{b.startTime} - {b.endTime}</span>
                                <span className="mx-2 font-medium">{car?.name}</span>
                                <span className="text-gray-600">({b.driver})</span>
                                {b.type === 'recurring' && <span className="ml-2 text-xs bg-blue-200 px-1 rounded">מחזורי</span>}
                              </div>
                              <button 
                                onClick={() => handleCancelBooking(b.id, b.type === 'recurring', dayStr)}
                                className="text-red-500 hover:bg-red-50 p-1 rounded"
                                title={b.type === 'recurring' ? "בטל חד פעמית ליום זה" : "מחק הזמנה"}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddBooking} className="bg-white rounded-lg p-6 w-full max-w-md space-y-4 shadow-xl">
            <h3 className="font-bold text-xl mb-4">שריון רכב</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">סוג הזמנה:</label>
              <select 
                className="w-full border p-2 rounded"
                value={newBooking.type}
                onChange={e => setNewBooking({...newBooking, type: e.target.value})}
              >
                <option value="once">חד פעמי</option>
                <option value="recurring">קבוע מחזורי (שבועי)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">רכב:</label>
                <select 
                  className="w-full border p-2 rounded"
                  value={newBooking.carId}
                  onChange={e => setNewBooking({...newBooking, carId: e.target.value})}
                >
                  {CARS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">נהג:</label>
                <select 
                  className="w-full border p-2 rounded"
                  value={newBooking.driver}
                  onChange={e => setNewBooking({...newBooking, driver: e.target.value})}
                >
                  {DRIVERS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {newBooking.type === 'once' ? (
               <div className="space-y-2">
                 <label className="text-sm font-medium">תאריך:</label>
                 <input 
                   type="date" 
                   required
                   className="w-full border p-2 rounded"
                   onChange={e => setNewBooking({...newBooking, date: e.target.value})}
                 />
               </div>
            ) : (
               <div className="space-y-2">
                 <label className="text-sm font-medium">יום בשבוע:</label>
                 <select 
                   className="w-full border p-2 rounded"
                   value={newBooking.day}
                   onChange={e => setNewBooking({...newBooking, day: e.target.value})}
                 >
                   {['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'].map((d, i) => (
                     <option key={i} value={i.toString()}>{d}</option>
                   ))}
                 </select>
               </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">משעה:</label>
                <input 
                  type="time" 
                  required
                  className="w-full border p-2 rounded"
                  value={newBooking.startTime}
                  onChange={e => setNewBooking({...newBooking, startTime: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">עד שעה:</label>
                <input 
                  type="time" 
                  required
                  className="w-full border p-2 rounded"
                  value={newBooking.endTime}
                  onChange={e => setNewBooking({...newBooking, endTime: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6 pt-4 border-t">
              <button 
                type="submit" 
                className="flex-1 bg-blue-600 text-white py-2 rounded font-medium"
              >
                שמור הזמנה
              </button>
              <button 
                type="button" 
                onClick={() => setIsBookingModalOpen(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded font-medium"
              >
                ביטול
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}