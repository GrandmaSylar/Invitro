import { useState } from "react";
import { Building2, Save, Edit, Trash2, UserRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LabBanner } from "./LabBanner";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { useHospitals, useCreateHospital, useDeleteHospital, useDoctors, useCreateDoctor, useDeleteDoctor } from "../../hooks/useRegistry";

export function HospitalRecords() {
  const [activeTab, setActiveTab] = useState<"hospital" | "doctor">("hospital");

  // Hospital Register State
  const [hospitalName, setHospitalName] = useState("");
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<number | null>(null);
  const [focusedHospitalIndex, setFocusedHospitalIndex] = useState<number | null>(null);

  // Doctor Register State
  const [doctorName, setDoctorName] = useState("");
  const [speciality, setSpeciality] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [affiliateHospital, setAffiliateHospital] = useState("");
  const [doctorLocation, setDoctorLocation] = useState("");
  const [address, setAddress] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [focusedDoctorIndex, setFocusedDoctorIndex] = useState<number | null>(null);

  // React Query hooks
  const { data: hospitalData = [], isLoading: hospitalsLoading } = useHospitals();
  const createHospital = useCreateHospital();
  const deleteHospital = useDeleteHospital();
  const { data: doctorData = [], isLoading: doctorsLoading } = useDoctors();
  const createDoctor = useCreateDoctor();
  const deleteDoctor = useDeleteDoctor();

  return (
    <div className="p-4 sm:p-6 h-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600">
          <Building2 size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Hospital Records</h2>
          <p className="text-sm text-muted-foreground">Manage Hospitals and Doctors</p>
        </div>
      </div>

      <div className="bg-card flex flex-col rounded-2xl shadow-sm border border-border/50 overflow-hidden">

        {/* Tabs */}
        <div className="border-b border-border/50 px-6 bg-muted/20">
          <div className="flex gap-4">
            {(["hospital", "doctor"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative px-2 py-4 text-sm font-semibold transition-colors duration-200 outline-none"
              >
                <span className={cn(
                  "relative z-10",
                  activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                  {tab === "hospital" ? "Hospital Register" : "Doctor's Register"}
                </span>
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-background">
          {activeTab === "hospital" ? (
            <form 
              onSubmit={async (e) => { 
                e.preventDefault(); 
                if (!hospitalName) return toast.error("Hospital name is required");
                try {
                  await createHospital.mutateAsync({
                    hospitalName,
                    location: location || undefined,
                    phoneNumber: phoneNumber || undefined,
                    address: hospitalAddress || undefined,
                  });
                  toast.success("Hospital saved.");
                  setHospitalName("");
                  setLocation("");
                  setPhoneNumber("");
                  setHospitalAddress("");
                } catch (error: any) {
                  toast.error(error.message);
                }
              }}
              className="bg-card border border-border/50 p-6 sm:p-8 rounded-2xl shadow-sm space-y-8"
            >
              {/* Top Input Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Hospital Name</label>
                  <input 
                    type="text"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Location</label>
                  <input 
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Phone Number</label>
                  <input 
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Hospital Address</label>
                  <input 
                    type="text"
                    value={hospitalAddress}
                    onChange={(e) => setHospitalAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              {/* Save Button Row */}
              <div className="flex justify-end mb-6 pb-6 border-b border-border">
                <Button type="submit" variant="green" size="sm" className="px-6" disabled={createHospital.isPending}>
                  {createHospital.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
                  Save
                </Button>
              </div>

              {/* Hospital Records Table */}
              {hospitalsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="animate-spin text-muted-foreground" size={40} />
                </div>
              ) : hospitalData.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded bg-muted/30">
                  <Building2 className="mx-auto text-muted-foreground mb-3" size={40} />
                  <p className="text-sm font-medium text-muted-foreground">No hospitals registered yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Fill in the form above and click Save to add a record</p>
                </div>
              ) : (
              <div 
                className="border border-border overflow-auto outline-none rounded" 
                style={{ maxHeight: "400px" }}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setFocusedHospitalIndex(prev => {
                      const nextIndex = prev === null ? 0 : Math.min(prev + 1, hospitalData.length - 1);
                      setSelectedHospital(nextIndex);
                      return nextIndex;
                    });
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setFocusedHospitalIndex(prev => {
                      const nextIndex = prev === null ? hospitalData.length - 1 : Math.max(prev - 1, 0);
                      setSelectedHospital(nextIndex);
                      return nextIndex;
                    });
                  }
                }}
              >
                <table className="w-full">
                  <thead className="bg-muted sticky top-0 border-b-2 border-border">
                    <tr>
                      <th className="border-r border-border px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Hospital Name</th>
                      <th className="border-r border-border px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Location</th>
                      <th className="border-r border-border px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Phone Number</th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hospitalData.map((hospital, index) => (
                      <tr 
                        key={hospital.id}
                        onClick={() => setSelectedHospital(index)}
                        className={`border-t border-border cursor-pointer transition-colors ${
                          selectedHospital === index 
                            ? 'bg-primary/10 border-l-4 border-l-primary' 
                            : index === focusedHospitalIndex
                              ? 'bg-muted ring-2 ring-inset ring-blue-500'
                              : index % 2 === 0
                                ? 'bg-background hover:bg-muted/50'
                                : 'bg-muted/30 hover:bg-muted/50'
                        }`}
                      >
                        <td className="border-r border-border px-3 py-2 text-xs font-semibold text-foreground">{hospital.hospitalName}</td>
                        <td className="border-r border-border px-3 py-2 text-xs text-muted-foreground">{hospital.location}</td>
                        <td className="border-r border-border px-3 py-2 text-xs text-muted-foreground">{hospital.phoneNumber}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{hospital.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-border flex gap-2">
                <Button 
                  type="button"
                  variant="red"
                  size="sm"
                  onClick={async () => {
                    if (selectedHospital !== null) {
                      const hospital = hospitalData[selectedHospital];
                      try {
                        await deleteHospital.mutateAsync(hospital.id);
                        setSelectedHospital(null);
                        toast("Record deleted.");
                      } catch (err: any) {
                        toast.error("Failed to delete record.");
                      }
                    }
                  }}
                  disabled={selectedHospital === null || deleteHospital.isPending}
                  className="px-6 text-xs"
                >
                  <Trash2 size={14} />
                  Delete
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { if (selectedHospital !== null) toast("Edit mode."); }}
                  disabled={selectedHospital === null}
                  className="px-6 text-xs"
                >
                  <Edit size={14} />
                  Edit
                </Button>
              </div>
            </form>
          ) : (
            <form 
              onSubmit={async (e) => { 
                e.preventDefault(); 
                if (!doctorName) return toast.error("Doctor's name is required");
                try {
                  await createDoctor.mutateAsync({
                    doctorName,
                    speciality: speciality || undefined,
                    phoneNumber: doctorPhone || undefined,
                    email: doctorEmail || undefined,
                    affiliateHospitalId: affiliateHospital || undefined,
                    location: doctorLocation || undefined,
                    address: address || undefined,
                  });
                  toast.success("Doctor saved.");
                  setDoctorName("");
                  setSpeciality("");
                  setDoctorPhone("");
                  setDoctorEmail("");
                  setAffiliateHospital("");
                  setDoctorLocation("");
                  setAddress("");
                } catch (error: any) {
                  toast.error(error.message);
                }
              }}
              className="bg-card border border-border p-6 rounded" style={{ boxShadow: 'var(--shadow-card)' }}
            >
              {/* Top Input Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pb-6 border-b border-border">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Doctor's Name</label>
                  <input 
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Speciality</label>
                  <input 
                    type="text"
                    value={speciality}
                    onChange={(e) => setSpeciality(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Phone Number</label>
                  <input 
                    type="text"
                    value={doctorPhone}
                    onChange={(e) => setDoctorPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Doctor's E-mail Address</label>
                  <input 
                    type="email"
                    value={doctorEmail}
                    onChange={(e) => setDoctorEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              {/* Second Input Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pb-6 border-b border-border">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Affiliate Hospital</label>
                  <select 
                    value={affiliateHospital}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAffiliateHospital(val);
                      if (val) {
                        const h = hospitalData.find(h => h.id === val);
                        if (h) {
                          setDoctorLocation(h.location || "");
                          setAddress(h.address || "");
                        }
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                  >
                    <option value="">Select Hospital (Optional)</option>
                    {hospitalData.map(h => (
                      <option key={h.id} value={h.id}>{h.hospitalName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Location</label>
                  <input 
                    type="text"
                    value={doctorLocation}
                    onChange={(e) => setDoctorLocation(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Address</label>
                  <input 
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background/50 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder:text-muted-foreground/60"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="green" size="sm" className="mt-auto px-6" disabled={createDoctor.isPending}>
                    {createDoctor.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
                    Save
                  </Button>
                </div>
              </div>

              {/* Doctor Records Table */}
              {doctorsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="animate-spin text-muted-foreground" size={40} />
                </div>
              ) : doctorData.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border rounded bg-muted/30">
                  <UserRound className="mx-auto text-muted-foreground mb-3" size={40} />
                  <p className="text-sm font-medium text-muted-foreground">No doctors registered yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Fill in the form above and click Save to add a record</p>
                </div>
              ) : (
              <div 
                className="border border-border overflow-auto outline-none rounded" 
                style={{ maxHeight: "400px" }}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setFocusedDoctorIndex(prev => {
                      const nextIndex = prev === null ? 0 : Math.min(prev + 1, doctorData.length - 1);
                      setSelectedDoctor(nextIndex);
                      return nextIndex;
                    });
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setFocusedDoctorIndex(prev => {
                      const nextIndex = prev === null ? doctorData.length - 1 : Math.max(prev - 1, 0);
                      setSelectedDoctor(nextIndex);
                      return nextIndex;
                    });
                  }
                }}
              >
                <table className="w-full">
                  <thead className="bg-muted sticky top-0 border-b-2 border-border">
                    <tr>
                      <th className="border-r border-border px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Doctor's Name</th>
                      <th className="border-r border-border px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Profession</th>
                      <th className="border-r border-border px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Telephone Number</th>
                      <th className="px-3 py-2 text-left text-xs uppercase tracking-wide font-bold text-muted-foreground">Affiliate Hospital</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorData.map((doctor, index) => (
                      <tr 
                        key={doctor.id}
                        onClick={() => setSelectedDoctor(index)}
                        className={`border-t border-border cursor-pointer transition-colors ${
                          selectedDoctor === index 
                            ? 'bg-primary/10 border-l-4 border-l-primary' 
                            : index === focusedDoctorIndex
                              ? 'bg-muted ring-2 ring-inset ring-blue-500'
                              : index % 2 === 0
                                ? 'bg-background hover:bg-muted/50'
                                : 'bg-muted/30 hover:bg-muted/50'
                        }`}
                      >
                        <td className="border-r border-border px-3 py-2 text-xs font-semibold text-foreground">{doctor.doctorName}</td>
                        <td className="border-r border-border px-3 py-2 text-xs text-muted-foreground">{doctor.speciality}</td>
                        <td className="border-r border-border px-3 py-2 text-xs text-muted-foreground">{doctor.phoneNumber}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{hospitalData.find(h => h.id === doctor.affiliateHospitalId)?.hospitalName ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}

              <div className="mt-4 pt-4 border-t border-border flex gap-2">
                <Button 
                  type="button"
                  variant="red"
                  size="sm"
                  onClick={async () => {
                    if (selectedDoctor !== null) {
                      const doctor = doctorData[selectedDoctor];
                      try {
                        await deleteDoctor.mutateAsync(doctor.id);
                        setSelectedDoctor(null);
                        toast("Record deleted.");
                      } catch (err: any) {
                        toast.error("Failed to delete record.");
                      }
                    }
                  }}
                  disabled={selectedDoctor === null || deleteDoctor.isPending}
                  className="px-6 text-xs"
                >
                  <Trash2 size={14} />
                  Delete
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { if (selectedDoctor !== null) toast("Edit mode."); }}
                  disabled={selectedDoctor === null}
                  className="px-6 text-xs"
                >
                  <Edit size={14} />
                  Edit
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
