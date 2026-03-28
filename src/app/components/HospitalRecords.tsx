import { useState } from "react";
import { Building2, Save, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LabBanner } from "./LabBanner";

interface HospitalRecord {
  id: string;
  hospitalId: string;
  profession: string;
  telephoneNumber: string;
  affiliateHospital: string;
}

interface DoctorRecord {
  id: string;
  doctorName: string;
  profession: string;
  telephoneNumber: string;
  affiliateHospital: string;
}

export function HospitalRecords() {
  const [activeTab, setActiveTab] = useState<"hospital" | "doctor">("hospital");

  // Hospital Register State
  const [hospitalId, setHospitalId] = useState("hd_112");
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
  const [doctorId, setDoctorId] = useState("dt_86");
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [focusedDoctorIndex, setFocusedDoctorIndex] = useState<number | null>(null);

  const [hospitalData, setHospitalData] = useState<HospitalRecord[]>([
    { id: "1", hospitalId: "hd_18", profession: "37 MILITARY HOSPITAL", telephoneNumber: "ACCRA", affiliateHospital: "" },
    { id: "2", hospitalId: "hd_44", profession: "ADJUENA HC", telephoneNumber: "ADJUENA", affiliateHospital: "" },
    { id: "3", hospitalId: "hd_24", profession: "AKOSOMBO INDUSTRIAL C...", telephoneNumber: "AKOSOMBO", affiliateHospital: "AFJI" },
    { id: "4", hospitalId: "hd_26", profession: "AKUSE GOVERNMENT HOS...", telephoneNumber: "AKUSE", affiliateHospital: "" },
    { id: "5", hospitalId: "hd_36", profession: "ASHAOYAMAN DISTRICT...", telephoneNumber: "ATIMPOKU", affiliateHospital: "" },
    { id: "6", hospitalId: "hd_5", profession: "ATUABO HEALTH CENTRE", telephoneNumber: "ATIMPOKU", affiliateHospital: "" },
    { id: "7", hospitalId: "hd_10", profession: "ATUA GOVERNMENT HOSP...", telephoneNumber: "ATUA", affiliateHospital: "" },
    { id: "8", hospitalId: "hd_78", profession: "BEACOIN INTERNATIONAL S...", telephoneNumber: "ABURI", affiliateHospital: "" },
    { id: "9", hospitalId: "hd_12", profession: "CENTRE FOR PLANT MED...", telephoneNumber: "MAMPONG", affiliateHospital: "" },
    { id: "10", hospitalId: "hd_108", profession: "CORPRECHE SCHOOL", telephoneNumber: "AKOSOMBO", affiliateHospital: "" },
    { id: "11", hospitalId: "hd_86", profession: "CUDDLE ME MONTESSORI", telephoneNumber: "AKOSOMBO", affiliateHospital: "" },
    { id: "12", hospitalId: "hd_46", profession: "EPI CHURCH AKOSOMBO", telephoneNumber: "AKOSOMBO", affiliateHospital: "" },
    { id: "13", hospitalId: "hd_76", profession: "EVERGREEN NATURAL WE...", telephoneNumber: "", affiliateHospital: "" },
    { id: "14", hospitalId: "hd_52", profession: "FREE HEART HERBAL CEN...", telephoneNumber: "ADJUENA", affiliateHospital: "" },
    { id: "15", hospitalId: "hd_8", profession: "GA WEST PRESBYTERY", telephoneNumber: "ACCRA", affiliateHospital: "" },
    { id: "16", hospitalId: "hd_11", profession: "GA PRESBYTERY", telephoneNumber: "ACCRA", affiliateHospital: "" },
  ]);

  const [doctorData, setDoctorData] = useState<DoctorRecord[]>([
    { id: "1", doctorName: "ASADIE FRANCISCA", profession: "", telephoneNumber: "", affiliateHospital: "37 MARTINDE PORRES H..." },
    { id: "2", doctorName: "DR. ASANTE", profession: "", telephoneNumber: "", affiliateHospital: "37 MARTINDE PORRES H..." },
    { id: "3", doctorName: "DR. BANSAH", profession: "", telephoneNumber: "", affiliateHospital: "37 MARTINDE PORRES H..." },
    { id: "4", doctorName: "DR. FRIMPONG", profession: "", telephoneNumber: "", affiliateHospital: "37 MARTINDE PORRES H..." },
    { id: "5", doctorName: "DR. OSMAN", profession: "", telephoneNumber: "", affiliateHospital: "37 MARTINDE PORRES H..." },
    { id: "6", doctorName: "DR. TETTEY", profession: "", telephoneNumber: "", affiliateHospital: "GA PRESBYTERY" },
    { id: "7", doctorName: "DR. TETTEY", profession: "", telephoneNumber: "", affiliateHospital: "GA PRESBYTERY" },
    { id: "8", doctorName: "DR. TETTEY (GP)", profession: "", telephoneNumber: "", affiliateHospital: "GA PRESBYTERY" },
    { id: "9", doctorName: "DR. TETTEY (GW)", profession: "", telephoneNumber: "", affiliateHospital: "GA PRESBYTERY" },
    { id: "10", doctorName: "MEDICAL SCREENING", profession: "", telephoneNumber: "", affiliateHospital: "CUDDLE ME MONTESSORI" },
    { id: "11", doctorName: "MEDICAL SCREENING", profession: "", telephoneNumber: "", affiliateHospital: "MEDICAL SCREENING" },
    { id: "12", doctorName: "THY DOCTOR", profession: "", telephoneNumber: "", affiliateHospital: "THY HOSPITAL" },
    { id: "13", doctorName: "UNKNOWN", profession: "", telephoneNumber: "", affiliateHospital: "" },
    { id: "14", doctorName: "UNKNOWN", profession: "", telephoneNumber: "", affiliateHospital: "VOLTA RIVER ESTATE LIM..." },
    { id: "15", doctorName: "UNKNOWN", profession: "", telephoneNumber: "", affiliateHospital: "NYAHO MEDICAL CENTRE" },
    { id: "16", doctorName: "UNKNOWN", profession: "", telephoneNumber: "", affiliateHospital: "GYANGYANLE SCHOOL" },
  ]);

  return (
    <div className="p-8 h-full">
      <div className="bg-white shadow-sm h-full flex flex-col">
        {/* Lab Header Banner */}
        <LabBanner className="border-b border-gray-300" />

        {/* Header */}
        <div className="border-b border-gray-300 px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <Building2 size={28} className="text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Hospital Records</h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-300 px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("hospital")}
              className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "hospital"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:bg-gray-100"
              }`}
            >
              Hospital Register
            </button>
            <button
              onClick={() => setActiveTab("doctor")}
              className={`px-6 py-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "doctor"
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:bg-gray-100"
              }`}
            >
              Doctor's Register
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          {activeTab === "hospital" ? (
            <form 
              onSubmit={(e) => { e.preventDefault(); toast.success("Hospital saved."); }}
              className="bg-white border border-gray-300 p-6"
            >
              {/* Top Input Row */}
              <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-300">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Hospital Name</label>
                  <input 
                    type="text"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Location</label>
                  <input 
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Hospital Address</label>
                  <input 
                    type="text"
                    value={hospitalAddress}
                    onChange={(e) => setHospitalAddress(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Hospital ID and Save Button Row */}
              <div className="flex items-end justify-between mb-6 pb-6 border-b border-gray-300">
                <div className="w-48">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Hospital ID</label>
                  <input 
                    type="text"
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <button type="submit" className="px-6 py-1 border border-gray-400 text-xs font-semibold text-green-700 hover:bg-green-50 border-green-400 transition-colors">
                  <Save size={14} className="inline mr-1" />
                  Save
                </button>
              </div>

              {/* Hospital Records Table */}
              <div 
                className="border border-gray-300 overflow-auto outline-none" 
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
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="border-r border-gray-300 px-3 py-2 text-left text-xs font-bold text-gray-700">Hospital ID</th>
                      <th className="border-r border-gray-300 px-3 py-2 text-left text-xs font-bold text-gray-700">Profession</th>
                      <th className="border-r border-gray-300 px-3 py-2 text-left text-xs font-bold text-gray-700">Telephone Number</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Affiliate Hospital</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hospitalData.map((hospital, index) => (
                      <tr 
                        key={hospital.id}
                        onClick={() => setSelectedHospital(index)}
                        className={`border-t border-gray-300 cursor-pointer transition-colors ${
                          selectedHospital === index 
                            ? 'bg-gray-300' 
                            : index === focusedHospitalIndex
                              ? 'bg-gray-100 ring-2 ring-inset ring-blue-500'
                              : 'hover:bg-gray-100'
                        }`}
                      >
                        <td className="border-r border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900">{hospital.hospitalId}</td>
                        <td className="border-r border-gray-300 px-3 py-2 text-xs text-gray-700">{hospital.profession}</td>
                        <td className="border-r border-gray-300 px-3 py-2 text-xs text-gray-700">{hospital.telephoneNumber}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{hospital.affiliateHospital}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    if (selectedHospital !== null) {
                      setHospitalData(prev => prev.filter((_, idx) => idx !== selectedHospital));
                      setSelectedHospital(null);
                      toast("Record deleted.");
                    }
                  }}
                  disabled={selectedHospital === null}
                  className={`px-6 py-1 border border-gray-400 text-xs font-semibold transition-colors ${
                    selectedHospital !== null 
                      ? 'text-red-700 hover:bg-red-50 border-red-400 cursor-pointer' 
                      : 'text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Trash2 size={14} className="inline mr-1" />
                  Delete
                </button>
                <button 
                  type="button"
                  onClick={() => { if (selectedHospital !== null) toast("Edit mode."); }}
                  disabled={selectedHospital === null}
                  className={`px-6 py-1 border border-gray-400 text-xs font-semibold transition-colors ${
                    selectedHospital !== null 
                      ? 'text-blue-700 hover:bg-blue-50 border-blue-400 cursor-pointer' 
                      : 'text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Edit size={14} className="inline mr-1" />
                  Edit
                </button>
              </div>
            </form>
          ) : (
            <form 
              onSubmit={(e) => { e.preventDefault(); toast.success("Doctor saved."); }}
              className="bg-white border border-gray-300 p-6"
            >
              {/* Top Input Row */}
              <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-300">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Doctor's Name</label>
                  <input 
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Speciality</label>
                  <input 
                    type="text"
                    value={speciality}
                    onChange={(e) => setSpeciality(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="text"
                    value={doctorPhone}
                    onChange={(e) => setDoctorPhone(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Doctor's E-mail Address</label>
                  <input 
                    type="email"
                    value={doctorEmail}
                    onChange={(e) => setDoctorEmail(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Second Input Row */}
              <div className="grid grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-300">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Affiliate Hospital</label>
                  <select 
                    value={affiliateHospital}
                    onChange={(e) => setAffiliateHospital(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="">Select Hospital</option>
                    <option value="37 MILITARY HOSPITAL">37 MILITARY HOSPITAL</option>
                    <option value="ADJUENA HC">ADJUENA HC</option>
                    <option value="AKOSOMBO INDUSTRIAL">AKOSOMBO INDUSTRIAL</option>
                    <option value="GA PRESBYTERY">GA PRESBYTERY</option>
                    <option value="CUDDLE ME MONTESSORI">CUDDLE ME MONTESSORI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Location</label>
                  <input 
                    type="text"
                    value={doctorLocation}
                    onChange={(e) => setDoctorLocation(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Address</label>
                  <input 
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Doctor ID</label>
                    <input 
                      type="text"
                      value={doctorId}
                      onChange={(e) => setDoctorId(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-400 text-sm focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <button type="submit" className="mt-auto px-6 py-1 border border-gray-400 text-xs font-semibold text-green-700 hover:bg-green-50 border-green-400 transition-colors">
                    <Save size={14} className="inline mr-1" />
                    Save
                  </button>
                </div>
              </div>

              {/* Doctor Records Table */}
              <div 
                className="border border-gray-300 overflow-auto outline-none" 
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
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="border-r border-gray-300 px-3 py-2 text-left text-xs font-bold text-gray-700">Doctor's Name</th>
                      <th className="border-r border-gray-300 px-3 py-2 text-left text-xs font-bold text-gray-700">Profession</th>
                      <th className="border-r border-gray-300 px-3 py-2 text-left text-xs font-bold text-gray-700">Telephone Number</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Affiliate Hospital</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorData.map((doctor, index) => (
                      <tr 
                        key={doctor.id}
                        onClick={() => setSelectedDoctor(index)}
                        className={`border-t border-gray-300 cursor-pointer transition-colors ${
                          selectedDoctor === index 
                            ? 'bg-gray-300' 
                            : index === focusedDoctorIndex
                              ? 'bg-gray-100 ring-2 ring-inset ring-blue-500'
                              : 'hover:bg-gray-100'
                        }`}
                      >
                        <td className="border-r border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900">{doctor.doctorName}</td>
                        <td className="border-r border-gray-300 px-3 py-2 text-xs text-gray-700">{doctor.profession}</td>
                        <td className="border-r border-gray-300 px-3 py-2 text-xs text-gray-700">{doctor.telephoneNumber}</td>
                        <td className="px-3 py-2 text-xs text-gray-700">{doctor.affiliateHospital}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    if (selectedDoctor !== null) {
                      setDoctorData(prev => prev.filter((_, idx) => idx !== selectedDoctor));
                      setSelectedDoctor(null);
                      toast("Record deleted.");
                    }
                  }}
                  disabled={selectedDoctor === null}
                  className={`px-6 py-1 border border-gray-400 text-xs font-semibold transition-colors ${
                    selectedDoctor !== null 
                      ? 'text-red-700 hover:bg-red-50 border-red-400 cursor-pointer' 
                      : 'text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Trash2 size={14} className="inline mr-1" />
                  Delete
                </button>
                <button 
                  type="button"
                  onClick={() => { if (selectedDoctor !== null) toast("Edit mode."); }}
                  disabled={selectedDoctor === null}
                  className={`px-6 py-1 border border-gray-400 text-xs font-semibold transition-colors ${
                    selectedDoctor !== null 
                      ? 'text-blue-700 hover:bg-blue-50 border-blue-400 cursor-pointer' 
                      : 'text-gray-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Edit size={14} className="inline mr-1" />
                  Edit
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
