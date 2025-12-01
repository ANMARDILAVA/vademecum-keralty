import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Info, Syringe, ShieldAlert, Calendar, X, Activity, 
  Filter, BookOpen, MapPin, Clock, Phone, HelpCircle, 
  Users, Baby, Plane, BriefcaseMedical, Menu, ChevronRight, ChevronDown, 
  Stethoscope, Book, TicketPercent, Lock, Unlock, Eye, EyeOff, Save, Edit3, CloudUpload, WifiOff, Plus, Trash2,
  CalendarCheck, Settings2, CheckSquare, Square, CheckCircle, AlertCircle, User, LogOut,
  // IMPORTANTE: Renombramos 'Map' a 'MapIcon' para evitar conflictos con el objeto Map de JS que usa Firebase
  Map as MapIcon 
} from 'lucide-react';

// --- IMPORTAR FIREBASE ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc 
} from "firebase/firestore";
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "firebase/auth";

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyAeePk1erddZcP3LrLALMfjLeAIGtUzS5A",
  authDomain: "vademecum-keralty.firebaseapp.com",
  projectId: "vademecum-keralty",
  storageBucket: "vademecum-keralty.firebasestorage.app",
  messagingSenderId: "180320538220",
  appId: "1:180320538220:web:bf0d99772ea2cec7c85249"
};

// Inicializar Firebase de forma segura con Singleton Pattern
let app = null;
let db = null;
let auth = null;
let firebaseError = null;

try {
  // Inicialización simplificada y robusta
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  db = getFirestore(app);
  auth = getAuth(app);
  
} catch (e) {
  console.error("Error inicializando Firebase:", e);
  firebaseError = e.message;
}

// --- COLORES CORPORATIVOS ---
const THEME = {
    blueDeep: '#002E58',
    blueMain: '#002F87',
    blueLight: '#0071A3',
    cyan: '#00B4E3',
    greenLight: '#8CC63F',
    greenTeal: '#00B288',
    gray: '#8C9DA3',
};

// --- BASE DE DATOS LOCAL (Respaldo) ---
const initialVaccineDatabase = [
  {
    id: 'gardasil',
    name: 'GARDASIL / GARDASIL 9',
    type: 'Viral',
    category: 'Adolescentes/Adultos',
    prevention: 'Virus del Papiloma Humano (VPH)',
    diseaseDescription: 'Infección viral de transmisión sexual más común. Los tipos de alto riesgo pueden causar cáncer de cuello uterino, ano y orofaringe.',
    scheme: '9 a 14 años: 2 dosis (0, 6-12 meses). >15 años: 3 dosis (0, 2, 6 meses).',
    route: 'Intramuscular',
    complications: 'Dolor en sitio de inyección, cefalea, síncope (desmayo).',
    contraindications: 'Hipersensibilidad, embarazo (precaución).',
    promoted: true,
    isVisible: true
  },
  {
    id: 'rotateq',
    name: 'ROTATEQ',
    type: 'Viral',
    category: 'Pediátrica',
    prevention: 'Gastroenteritis por Rotavirus',
    diseaseDescription: 'Infección viral altamente contagiosa que causa diarrea severa, vómitos, fiebre y deshidratación.',
    scheme: '3 dosis orales: 2, 4 y 6 meses de edad.',
    route: 'Oral',
    complications: 'Irritabilidad, diarrea leve, vómito.',
    contraindications: 'Antecedente de invaginación intestinal, inmunodeficiencia severa.',
    promoted: false,
    isVisible: true
  },
  {
    id: 'proquad',
    name: 'PROQUAD',
    type: 'Viral',
    category: 'Pediátrica',
    prevention: 'Sarampión, Parotiditis, Rubéola y Varicela',
    diseaseDescription: 'Sarampión: Enfermedad respiratoria grave. Parotiditis: Inflamación glandular. Rubéola: Exantema. Varicela: Erupción vesicular.',
    scheme: 'Dos dosis: 12-15 meses y refuerzo a los 4-6 años.',
    route: 'Subcutánea',
    complications: 'Fiebre, exantema leve, dolor local.',
    contraindications: 'Embarazo, anafilaxia a neomicina, inmunosupresión.',
    promoted: false,
    isVisible: true
  },
  {
    id: 'varivax',
    name: 'VARIVAX',
    type: 'Viral',
    category: 'Pediátrica',
    prevention: 'Varicela',
    diseaseDescription: 'Enfermedad viral aguda caracterizada por fiebre y una erupción cutánea generalizada de vesículas.',
    scheme: 'A partir de los 12 meses. Esquema de 2 dosis separado por 4-8 semanas.',
    route: 'Subcutánea',
    complications: 'Dolor local, erupción tipo varicela leve.',
    contraindications: 'Embarazo, inmunosupresión severa.',
    promoted: false,
    isVisible: true
  },
  {
    id: 'vaxneuvance',
    name: 'VAXNEUVANCE',
    type: 'Bacteriana',
    category: 'Pediátrica/Adulto',
    prevention: 'Enfermedad Neumocócica',
    diseaseDescription: 'Infección por Streptococcus pneumoniae que puede causar otitis media, neumonía, bacteriemia y meningitis.',
    scheme: 'Serie primaria 2, 4, 6 meses y refuerzo 12-15 meses.',
    route: 'Intramuscular',
    complications: 'Irritabilidad, somnolencia, dolor local.',
    contraindications: 'Hipersensibilidad severa a componentes.',
    promoted: false,
    isVisible: true
  },
  {
    id: 'boostrix',
    name: 'BOOSTRIX',
    type: 'Bacteriana',
    category: 'Adolescente/Adulto',
    prevention: 'Difteria, Tétanos y Tos ferina',
    diseaseDescription: 'Difteria: Obstrucción vía aérea. Tétanos: Espasmos musculares. Tos ferina: Tos violenta.',
    scheme: 'Refuerzo cada 10 años o en cada embarazo (semanas 27-36).',
    route: 'Intramuscular',
    complications: 'Fatiga, cefalea, dolor en sitio de inyección.',
    contraindications: 'Encefalopatía post-vacunal previa.',
    promoted: false,
    isVisible: true
  },
  {
    id: 'havrix1440',
    name: 'HAVRIX 1440',
    type: 'Viral',
    category: 'Adulto',
    prevention: 'Hepatitis A',
    diseaseDescription: 'Infección viral del hígado transmitida por alimentos o agua contaminados.',
    scheme: '2 dosis: 0 y 6-12 meses después de la primera.',
    route: 'Intramuscular',
    complications: 'Cefalea, malestar general.',
    contraindications: 'Hipersensibilidad a neomicina.',
    promoted: false,
    isVisible: true
  },
  {
    id: 'havrix720',
    name: 'HAVRIX 720',
    type: 'Viral',
    category: 'Pediátrica',
    prevention: 'Hepatitis A (Niños)',
    diseaseDescription: 'Infección viral hepática aguda. Niños suelen ser asintomáticos.',
    scheme: 'A partir del año de edad. 2 dosis: 0 y 6-12 meses.',
    route: 'Intramuscular',
    complications: 'Dolor leve, pérdida de apetito transitoria.',
    contraindications: 'Hipersensibilidad severa.',
    promoted: false,
    isVisible: true
  },
  {
    id: 'infanrixhexa',
    name: 'INFANRIX HEXA / HEXAXIM',
    type: 'Combinada',
    category: 'Pediátrica',
    prevention: 'Difteria, Tétanos, Tos ferina, Hep B, Polio, Hib',
    diseaseDescription: 'Protección 6-en-1 contra múltiples patógenos graves de la infancia.',
    scheme: '2, 4, 6 meses y refuerzo a los 18 meses.',
    route: 'Intramuscular',
    complications: 'Fiebre, irritabilidad, induración local.',
    contraindications: 'Encefalopatía de causa desconocida.',
    promoted: false,
    isVisible: true
  },
  {
    id: 'priorix',
    name: 'PRIORIX',
    type: 'Viral',
    category: 'Pediátrica',
    prevention: 'Sarampión, Rubéola, Parotiditis (SRP)',
    diseaseDescription: 'Triple Viral. Previene complicaciones graves como neumonía y síndrome de rubéola congénita.',
    scheme: '12 meses y 5 años (refuerzo).',
    route: 'Subcutánea',
    complications: 'Fiebre entre 7-12 días post vacunación.',
    contraindications: 'Embarazo, inmunosupresión.',
    promoted: false,
    isVisible: true
  },
  {
    id: 'bexsero',
    name: 'BEXSERO',
    type: 'Bacteriana',
    category: 'Pediátrica',
    prevention: 'Meningococo Serogrupo B',
    diseaseDescription: 'Meningitis y sepsis agresiva causada por serogrupo B.',
    scheme: '2 o 3 dosis según edad + refuerzo.',
    route: 'Intramuscular (profunda)',
    complications: 'Fiebre alta, dolor en extremidad.',
    contraindications: 'Hipersensibilidad.',
    promoted: true,
    isVisible: true
  },
  {
    id: 'shingrix',
    name: 'SHINGRIX',
    type: 'Viral',
    category: 'Adulto Mayor',
    prevention: 'Herpes Zóster (Culebrilla)',
    diseaseDescription: 'Reactivación de varicela. Erupción dolorosa y neuralgia.',
    scheme: '2 dosis separadas por 2-6 meses (>50 años).',
    route: 'Intramuscular',
    complications: 'Mialgia, fatiga, cefalea, fiebre.',
    contraindications: 'Alergia grave a componentes.',
    promoted: true,
    isVisible: true
  },
  {
    id: 'prevenar',
    name: 'PREVENAR 13 / PNEUMOVAX 23',
    type: 'Bacteriana',
    category: 'Pediátrica/Adulto',
    prevention: 'Neumonía Neumocócica',
    diseaseDescription: 'Infección pulmonar grave, otitis media y meningitis.',
    scheme: 'Prevenar: 2, 4, 12 meses. Pneumovax: >65 años.',
    route: 'Intramuscular',
    complications: 'Disminución de apetito, irritabilidad.',
    contraindications: 'Hipersensibilidad.',
    promoted: true,
    isVisible: true
  },
  {
    id: 'influenza',
    name: 'VAXIGRIP / INFLUVAC / FLUZONE',
    type: 'Viral',
    category: 'Estacional',
    prevention: 'Influenza (Gripe)',
    diseaseDescription: 'Infección viral respiratoria aguda grave.',
    scheme: 'Anual.',
    route: 'Intramuscular',
    complications: 'Malestar general, fiebre baja.',
    contraindications: 'Alergia severa al huevo.',
    promoted: true,
    isVisible: true
  },
  {
    id: 'stamaril',
    name: 'STAMARIL',
    type: 'Viral',
    category: 'Viajero',
    prevention: 'Fiebre Amarilla',
    diseaseDescription: 'Enfermedad viral hemorrágica transmitida por mosquitos.',
    scheme: 'Dosis única (refuerzo s/n riesgo).',
    route: 'Subcutánea o Intramuscular',
    complications: 'Dolor, fiebre leve.',
    contraindications: 'Alergia al HUEVO, inmunosupresión.',
    alert: 'Contraindicado en alergia al huevo.',
    promoted: false,
    isVisible: true
  }
];

const initialPediatricSchedule = [
  { age: 'Recién Nacido (0 Meses)', vaccineIds: [] }, 
  { age: '2 Meses', vaccineIds: ['infanrixhexa', 'prevenar', 'rotateq', 'vaxneuvance'] },
  { age: '4 Meses', vaccineIds: ['infanrixhexa', 'prevenar', 'rotateq', 'vaxneuvance'] },
  { age: '6 Meses', vaccineIds: ['infanrixhexa', 'rotateq', 'influenza', 'vaxneuvance'] },
  { age: '7 Meses', vaccineIds: ['influenza'] },
  { age: '12 Meses', vaccineIds: ['priorix', 'varivax', 'prevenar', 'avaxim', 'nimenrix', 'menveo', 'vaxneuvance'] },
  { age: '18 Meses', vaccineIds: ['infanrixhexa', 'havrix720', 'infanrixpenta', 'varivax'] },
  { age: '5 Años', vaccineIds: ['priorix', 'adacel', 'proquad', 'tetraxim', 'boostrix'] },
];

const initialLocationData = {
    hours: "Todos los días: 8:00 AM - 6:00 PM",
    address: "Carrera 14 #96-22, Bogotá",
    phone: "5895455",
    ext: "5718033",
    placeName: "Centro Médico Colsanitas Premium Calle 96"
};

const initialFaqs = [
  { id: 1, q: "¿Qué debo hacer si presento fiebre después de la vacuna?", a: "Es común presentar febrícula o fiebre leve (<38.5°C). Puede administrar antipiréticos (paracetamol) según indicación médica, hidratarse bien y usar paños tibios. Si la fiebre persiste más de 48 horas, consulte." },
  { id: 2, q: "¿Puedo beber alcohol después de vacunarme?", a: "No hay una contraindicación absoluta, pero se recomienda evitar el exceso de alcohol las primeras 24-48 horas para no enmascarar posibles efectos adversos como dolor de cabeza o malestar." },
  { id: 3, q: "¿Se pueden administrar varias vacunas el mismo día?", a: "Sí, la mayoría de las vacunas (inactivadas y vivas) se pueden administrar simultáneamente en sitios anatómicos diferentes sin riesgo adicional." },
  { id: 4, q: "¿Qué hago si se me forma un bulto en el sitio de inyección?", a: "Puede aparecer un nódulo o induración. Generalmente desaparece solo en semanas. Si hay calor, rubor intenso o dolor severo, podría ser un absceso y requiere valoración médica." },
];

const colorThemes = [
  { bg: 'bg-[#002F87]/5', border: 'border-[#002F87]/20', bar: 'bg-[#002F87]', text: 'text-[#002E58]', icon: 'text-[#002F87]', tag: 'bg-[#002F87]/10 text-[#002F87]' },
  { bg: 'bg-[#8CC63F]/5', border: 'border-[#8CC63F]/30', bar: 'bg-[#8CC63F]', text: 'text-[#002E58]', icon: 'text-[#8CC63F]', tag: 'bg-[#8CC63F]/10 text-[#4E9D2D]' },
  { bg: 'bg-[#00B4E3]/5', border: 'border-[#00B4E3]/20', bar: 'bg-[#00B4E3]', text: 'text-[#002E58]', icon: 'text-[#00B4E3]', tag: 'bg-[#00B4E3]/10 text-[#0071A3]' },
  { bg: 'bg-[#00B288]/5', border: 'border-[#00B288]/30', bar: 'bg-[#00B288]', text: 'text-[#002E58]', icon: 'text-[#00B288]', tag: 'bg-[#00B288]/10 text-[#007F60]' },
  { bg: 'bg-[#3E8EDE]/5', border: 'border-[#3E8EDE]/20', bar: 'bg-[#3E8EDE]', text: 'text-[#002E58]', icon: 'text-[#3E8EDE]', tag: 'bg-[#3E8EDE]/10 text-[#005C9E]' },
  { bg: 'bg-slate-50', border: 'border-slate-200', bar: 'bg-[#8C9DA3]', text: 'text-[#002E58]', icon: 'text-[#8C9DA3]', tag: 'bg-slate-100 text-slate-600' },
];

const getThemeForVaccine = (index) => colorThemes[index % colorThemes.length];

// --- COMPONENTE TOAST (Notificaciones) ---
const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-in slide-in-from-right fade-in duration-300 ${
            toast.type === 'error' ? 'bg-red-500' : 
            toast.type === 'success' ? 'bg-[#8CC63F] text-[#002E58]' : 
            'bg-[#002F87]'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle size={16}/> : 
           toast.type === 'error' ? <AlertCircle size={16}/> : 
           <Info size={16}/>}
          {toast.message}
          <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

// --- MODALES ---

const AddVaccineModal = ({ isOpen, onClose, onAdd, showToast }) => {
  const [formData, setFormData] = useState({
    name: '', type: 'Viral', category: 'Adulto', prevention: '',
    diseaseDescription: '', scheme: '', route: 'Intramuscular',
    complications: '', contraindications: '', promoted: false, isVisible: true
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
        showToast("El nombre es obligatorio", "error");
        return;
    }
    const newVaccine = { ...formData, id: Date.now().toString() };
    onAdd(newVaccine);
    onClose();
    setFormData({
      name: '', type: 'Viral', category: 'Adulto', prevention: '',
      diseaseDescription: '', scheme: '', route: 'Intramuscular',
      complications: '', contraindications: '', promoted: false, isVisible: true
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className={`p-4 rounded-t-xl text-white flex justify-between items-center sticky top-0 z-10 bg-[#002F87]`}>
          <h2 className="text-xl font-bold flex items-center gap-2"><Plus size={24}/> Nuevo Biológico</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#002E58]">Nombre Comercial</label>
              <input name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#00B4E3]" placeholder="Ej: Gardasil" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#002E58]">Enfermedad que Previene</label>
              <input name="prevention" value={formData.prevention} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#00B4E3]" placeholder="Ej: VPH" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#002E58]">Tipo</label>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#00B4E3]">
                <option>Viral</option>
                <option>Bacteriana</option>
                <option>Combinada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-[#002E58]">Categoría</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#00B4E3]">
                <option>Pediátrica</option>
                <option>Adulto</option>
                <option>Viajero</option>
                <option>Combinada</option>
                <option>Urgencia</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#002E58]">Descripción Enfermedad</label>
            <textarea name="diseaseDescription" value={formData.diseaseDescription} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#00B4E3]" rows="2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[#002E58]">Esquema</label>
              <input name="scheme" value={formData.scheme} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#00B4E3]" />
            </div>
            <div>
               <label className="block text-sm font-bold text-[#002E58]">Vía</label>
               <input name="route" value={formData.route} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#00B4E3]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#002E58]">Complicaciones / ESAVI</label>
            <textarea name="complications" value={formData.complications} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#00B4E3]" rows="2" />
          </div>
          <div>
             <label className="block text-sm font-bold text-[#002E58]">Contraindicaciones</label>
             <textarea name="contraindications" value={formData.contraindications} onChange={handleChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-[#00B4E3]" rows="2" />
          </div>
           
          <div className="pt-4 border-t flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-[#002F87] text-white rounded font-bold hover:bg-[#002E58]">Guardar Biológico</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditLocationModal = ({ isOpen, onClose, locationData, onSave, showToast }) => {
    const [data, setData] = useState(locationData);

    useEffect(() => {
        if(isOpen) setData(locationData);
    }, [isOpen, locationData]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(data);
        onClose();
        showToast("Información de ubicación actualizada", "success");
    }

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-[#002E58] mb-4 flex items-center gap-2"><Edit3 size={20}/> Editar Ubicación y Horarios</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Nombre del Centro</label>
                        <input name="placeName" value={data.placeName} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-[#002F87]" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Dirección</label>
                        <input name="address" value={data.address} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-[#002F87]" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Horarios</label>
                        <textarea name="hours" value={data.hours} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-[#002F87]" rows="2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Teléfono</label>
                            <input name="phone" value={data.phone} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-[#002F87]" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700">Extensión</label>
                            <input name="ext" value={data.ext} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-[#002F87]" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-[#002F87] text-white rounded hover:bg-[#002E58]">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EditFAQModal = ({ isOpen, onClose, faq, onSave }) => {
    const [data, setData] = useState({ q: '', a: '' });

    useEffect(() => {
        if(isOpen && faq) setData(faq);
        else if (isOpen) setData({ q: '', a: '' });
    }, [isOpen, faq]);

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-[#002E58] mb-4">{faq ? 'Editar Pregunta' : 'Nueva Pregunta'}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Pregunta</label>
                        <input 
                            className="w-full border rounded p-2" 
                            value={data.q} 
                            onChange={e => setData(p => ({...p, q: e.target.value}))}
                            placeholder="¿Cuál es la pregunta?"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700">Respuesta</label>
                        <textarea 
                            className="w-full border rounded p-2" 
                            rows="4"
                            value={data.a} 
                            onChange={e => setData(p => ({...p, a: e.target.value}))}
                            placeholder="Escriba la respuesta detallada..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
                        <button 
                            onClick={() => { onSave(data); onClose(); }} 
                            className="px-4 py-2 bg-[#002F87] text-white rounded hover:bg-[#002E58]"
                            disabled={!data.q || !data.a}
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ScheduleEditModal = ({ isOpen, onClose, ageGroup, allVaccines, currentVaccineIds, onSave }) => {
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(currentVaccineIds || []);
    }
  }, [isOpen, currentVaccineIds]);

  if (!isOpen) return null;

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(vid => vid !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="bg-[#002F87] p-4 rounded-t-xl text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Edit3 size={20} /> Editar Esquema: {ageGroup}
          </h3>
          <p className="text-[#00B4E3] text-xs mt-1">Seleccione los biológicos que aplican para esta edad.</p>
        </div>
        
        <div className="p-4 overflow-y-auto flex-grow">
          {allVaccines.map(vac => (
            <div 
              key={vac.id}
              onClick={() => toggleSelection(vac.id)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer mb-2 border transition-all ${
                selectedIds.includes(vac.id) 
                  ? 'bg-[#00B4E3]/10 border-[#00B4E3]' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              {selectedIds.includes(vac.id) 
                ? <CheckSquare className="text-[#002F87] flex-shrink-0" /> 
                : <Square className="text-gray-400 flex-shrink-0" />
              }
              <div>
                <p className="font-bold text-sm text-[#002E58]">{vac.name}</p>
                <p className="text-xs text-gray-500">{vac.prevention}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Cancelar</button>
          <button 
            onClick={() => onSave(selectedIds)} 
            className="px-6 py-2 bg-[#002F87] text-white font-bold rounded-lg hover:bg-[#002E58] flex items-center gap-2"
          >
            <Save size={18} /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

const LoginModal = ({ isOpen, onClose, onLogin, showToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (auth) {
        // MODO FIREBASE AUTH
        try {
            await signInWithEmailAndPassword(auth, email, password);
            onLogin();
            onClose();
            showToast("Sesión iniciada correctamente", "success");
        } catch (error) {
            console.error(error);
            showToast("Error de autenticación: Verifica tus credenciales", "error");
        }
    } else {
        // MODO LOCAL (FALLBACK)
        if (password === '1234') { 
          onLogin();
          onClose();
          showToast("Bienvenido, Administrador (Local)", "success");
        } else {
          showToast("Código incorrecto", "error");
        }
    }
    setLoading(false);
    // Limpiar campos
    setPassword('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold text-[#002E58] mb-4 flex items-center gap-2">
          <Lock size={20} className="text-[#002F87]" />
          Acceso Administrativo
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {auth && (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input 
                type="email" 
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#00B4E3] outline-none"
                placeholder="admin@keralty.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {auth ? 'Contraseña' : 'Código de Acceso'}
            </label>
            <input 
              type="password" 
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#00B4E3] outline-none"
              placeholder={auth ? "••••••" : "Ingrese código..."}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus={!auth}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-[#002F87] text-white rounded-lg hover:bg-[#002E58] disabled:opacity-50">
                {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-bold text-[#002E58] mb-2">{title}</h3>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex gap-2 justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                    <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

const DetailModal = ({ vaccine, onClose, isAdmin, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (vaccine) {
      setFormData({ ...vaccine });
      setIsEditing(false);
    }
  }, [vaccine]);

  if (!vaccine) return null;
  const originalIndex = initialVaccineDatabase.findIndex(v => v.id === vaccine.id);
  const theme = getThemeForVaccine(Math.max(0, originalIndex));

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col border-2 ${theme.border}`}>
        <div className={`${theme.bar} p-6 rounded-t-lg text-white flex justify-between items-start sticky top-0 z-10 shadow-md`}>
          <div className="flex-1 mr-4">
            <div className="flex gap-2 mb-2 items-center">
               <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider inline-block">
                {vaccine.type}
              </span>
              {vaccine.promoted && (
                <span className="bg-[#8CC63F] text-[#002E58] text-xs font-bold px-2 py-1 rounded uppercase tracking-wider inline-flex items-center gap-1">
                  <TicketPercent size={12} /> Promoción
                </span>
              )}
            </div>
            
            {isEditing ? (
              <input 
                className="text-2xl font-bold leading-tight bg-white/20 border-b border-white text-white w-full placeholder-white/50 outline-none rounded px-1"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            ) : (
              <h2 className="text-2xl font-bold leading-tight">{vaccine.name}</h2>
            )}

            {isEditing ? (
              <input 
                className="text-white/90 mt-1 text-sm font-medium bg-white/20 border-b border-white w-full outline-none rounded px-1"
                value={formData.prevention}
                onChange={(e) => handleInputChange('prevention', e.target.value)}
              />
            ) : (
              <p className="text-white/90 mt-1 text-sm font-medium">{vaccine.prevention}</p>
            )}
          </div>
          <div className="flex gap-2">
            {isAdmin && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors" title="Editar Información">
                <Edit3 size={24} />
              </button>
            )}
            {isAdmin && isEditing && (
               <button onClick={handleSave} className="bg-white text-[#002F87] hover:bg-[#F4F7F9] p-2 rounded-full transition-colors shadow-lg" title="Guardar Cambios">
                <Save size={24} />
              </button>
            )}
            <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-[#F4F7F9] border-l-4 border-[#8C9DA3] p-4 rounded-r-lg">
             <div className="flex items-center gap-2 mb-2 text-[#002E58] font-bold">
                <Stethoscope size={20} className="text-[#8C9DA3]" />
                <h3>Patología / Enfermedad</h3>
             </div>
             {isEditing ? (
               <textarea 
                 className="w-full text-sm text-gray-700 border p-2 rounded"
                 value={formData.diseaseDescription}
                 onChange={(e) => handleInputChange('diseaseDescription', e.target.value)}
                 rows={3}
               />
             ) : (
               <p className="text-gray-700 text-sm italic">
                 {vaccine.diseaseDescription || "Consulte la ficha técnica para más información sobre la patología."}
               </p>
             )}
          </div>

          {(vaccine.alert || isEditing) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <ShieldAlert className="text-red-600 flex-shrink-0" />
                <div className="w-full">
                  <h4 className="font-bold text-red-800">Precaución Importante</h4>
                  {isEditing ? (
                    <textarea 
                      className="w-full text-sm text-red-700 border p-2 rounded mt-1"
                      placeholder="Escriba alerta si aplica (o deje vacío)"
                      value={formData.alert || ''}
                      onChange={(e) => handleInputChange('alert', e.target.value)}
                    />
                  ) : (
                    <p className="text-red-700 text-sm">{vaccine.alert}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${theme.bg} border ${theme.border} p-4 rounded-lg`}>
              <div className={`flex items-center gap-2 mb-2 font-bold ${theme.text}`}>
                <Calendar size={20} className={theme.icon} />
                <h3>Esquema y Dosis</h3>
              </div>
              {isEditing ? (
                <textarea 
                  className="w-full text-sm text-gray-700 border p-2 rounded bg-white"
                  value={formData.scheme}
                  onChange={(e) => handleInputChange('scheme', e.target.value)}
                  rows={3}
                />
              ) : (
                <p className="text-gray-700 text-sm leading-relaxed">{vaccine.scheme}</p>
              )}
            </div>
            <div className={`${theme.bg} border ${theme.border} p-4 rounded-lg`}>
              <div className={`flex items-center gap-2 mb-2 font-bold ${theme.text}`}>
                <Syringe size={20} className={theme.icon} />
                <h3>Vía de Administración</h3>
              </div>
              {isEditing ? (
                 <input 
                   className="w-full text-sm text-gray-700 border p-2 rounded bg-white"
                   value={formData.route}
                   onChange={(e) => handleInputChange('route', e.target.value)}
                 />
              ) : (
                <p className="text-gray-700 text-sm">{vaccine.route}</p>
              )}
            </div>
          </div>
           
          <div>
            <h3 className="font-bold text-[#002E58] mb-2 flex items-center gap-2"><Activity size={18} /> Complicaciones / ESAVI</h3>
            {isEditing ? (
              <textarea 
                className="w-full text-sm text-gray-600 border p-2 rounded"
                value={formData.complications}
                onChange={(e) => handleInputChange('complications', e.target.value)}
                rows={2}
              />
            ) : (
              <p className="text-gray-600 text-sm border-l-2 border-[#8C9DA3] pl-3">{vaccine.complications}</p>
            )}
          </div>
          <div>
            <h3 className="font-bold text-[#002E58] mb-2 flex items-center gap-2"><ShieldAlert size={18} /> Contraindicaciones</h3>
            {isEditing ? (
               <textarea 
                 className="w-full text-sm text-gray-600 border p-2 rounded"
                 value={formData.contraindications}
                 onChange={(e) => handleInputChange('contraindications', e.target.value)}
                 rows={2}
               />
            ) : (
              <p className="text-gray-600 text-sm border-l-2 border-red-200 pl-3">{vaccine.contraindications}</p>
            )}
          </div>
        </div>
        <div className="p-4 border-t bg-[#F4F7F9] text-right">
          <button onClick={onClose} className="px-6 py-2 bg-[#8C9DA3] hover:bg-gray-400 text-white font-medium rounded transition-colors">
            {isEditing ? 'Cancelar Edición' : 'Cerrar Ficha'}
          </button>
        </div>
      </div>
    </div>
  );
};

const VaccineCard = ({ vac, onClick, isAdmin, onToggleVisibility, onTogglePromo, onRequestDelete, minimal = false }) => {
  const originalIndex = initialVaccineDatabase.findIndex(v => v.id === vac.id);
  const theme = getThemeForVaccine(Math.max(0, originalIndex));
  
  if (!vac.isVisible && !isAdmin) return null;

  if (minimal) {
    return (
      <div 
        onClick={onClick}
        className={`bg-white rounded-lg shadow-sm border ${theme.border} cursor-pointer hover:shadow-md transition-all flex items-center p-3 gap-3`}
      >
        <div className={`w-2 h-10 rounded-full ${theme.bar}`}></div>
        <div className="flex-1">
          <h4 className={`font-bold text-sm ${theme.text}`}>{vac.name}</h4>
          <p className="text-xs text-gray-500">{vac.prevention}</p>
        </div>
        <ChevronRight size={16} className="text-[#8C9DA3]" />
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm hover:shadow-lg border ${theme.border} transition-all duration-200 overflow-hidden group h-full flex flex-col relative ${!vac.isVisible ? 'opacity-60 ring-2 ring-gray-400' : ''}`}
    >
      {vac.promoted && (
        <div className="absolute top-0 right-0 bg-[#8CC63F] text-[#002E58] text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10 shadow-sm flex items-center gap-1 pointer-events-none">
          <TicketPercent size={12} /> PROMO
        </div>
      )}

      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          <button 
            onClick={(e) => { e.stopPropagation(); onTogglePromo(vac); }}
            className={`p-1.5 rounded-full shadow-sm border ${vac.promoted ? 'bg-[#8CC63F]/20 text-[#4E9D2D] border-[#8CC63F]' : 'bg-white text-gray-400 border-gray-200 hover:text-[#8CC63F]'}`}
            title="Alternar Promoción"
          >
            <TicketPercent size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(vac); }}
            className={`p-1.5 rounded-full shadow-sm border ${vac.isVisible ? 'bg-white text-gray-500 border-gray-200 hover:text-[#002F87]' : 'bg-gray-800 text-white border-gray-900'}`}
            title={vac.isVisible ? "Ocultar Vacuna" : "Mostrar Vacuna"}
          >
            {vac.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              onRequestDelete(vac);
            }}
            className="p-1.5 rounded-full shadow-sm border bg-red-100 text-red-600 border-red-200 hover:bg-red-500 hover:text-white transition-colors"
            title="Eliminar Biológico"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <div onClick={onClick} className="flex-grow flex flex-col cursor-pointer">
        <div className={`h-2 ${theme.bar} transition-colors`}></div>
        <div className={`p-5 ${theme.bg} flex-grow flex flex-col`}>
          <div className="flex justify-between items-start mb-2 pr-20">
            <h3 className={`font-bold text-lg ${theme.text} leading-snug`}>
              {vac.name} 
              {!vac.isVisible && <span className="block text-xs text-gray-500 mt-1 uppercase tracking-wide font-bold">(Oculto al público)</span>}
            </h3>
            {!isAdmin && <Info size={18} className={`${theme.icon} opacity-70 group-hover:opacity-100`} />}
          </div>
          <div className="mb-3">
            <span className={`inline-block px-2 py-0.5 rounded ${theme.tag} text-xs font-bold`}>{vac.category}</span>
          </div>
          <p className="text-sm text-[#002E58] line-clamp-2 mb-4 bg-white/50 p-2 rounded border border-white/50 flex-grow">
            <span className="font-medium text-[#002E58]">Previene:</span> {vac.prevention}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-600 font-medium bg-white/60 p-2 rounded mt-auto">
            <Syringe size={14} className={theme.icon} />
            {vac.route}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- VISTAS PRINCIPALES ---

const DiseasesDictionaryView = ({ vaccines, onSelectVaccine, isAdmin, onToggleVisibility }) => {
  const visibleVaccines = vaccines.filter(v => isAdmin || v.isVisible);
  const sortedData = [...visibleVaccines].sort((a, b) => a.prevention.localeCompare(b.prevention));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-[#002E58] flex items-center gap-2 mb-2">
          <Book className="text-[#002F87]" /> Diccionario de Patologías
        </h2>
        <p className="text-[#8C9DA3]">Guía rápida de enfermedades prevenibles por vacunación.</p>
        {isAdmin && <p className="text-xs text-[#00B4E3] mt-2 flex items-center gap-1"><Info size={12}/> Puede editar el contenido de las patologías haciendo clic en "Editar / Ver".</p>}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedData.map((vac) => (
          <div key={vac.id} className={`bg-white p-5 rounded-lg border-l-4 border-[#002F87] shadow-sm hover:shadow-md transition-shadow ${!vac.isVisible ? 'opacity-60 bg-gray-50' : ''}`}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                   <h3 className="text-lg font-bold text-[#002E58] mb-1">{vac.prevention}</h3>
                   {vac.promoted && <span className="text-xs bg-[#8CC63F]/20 text-[#4E9D2D] px-2 py-0.5 rounded font-bold border border-[#8CC63F]">Oferta</span>}
                   {!vac.isVisible && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold">Oculto</span>}
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{vac.diseaseDescription}</p>
                <div className="inline-flex items-center gap-2 bg-[#F4F7F9] text-[#002F87] px-3 py-1 rounded-full text-xs font-semibold">
                   Biológico: {vac.name}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => onSelectVaccine(vac)}
                    className="self-start md:self-center px-4 py-2 text-sm font-medium text-[#002F87] bg-white border border-gray-200 rounded-lg hover:bg-[#F4F7F9] whitespace-nowrap flex items-center gap-2"
                  >
                    {isAdmin && <Edit3 size={14}/>} {isAdmin ? 'Editar / Ver' : 'Ver Vacuna'}
                  </button>
                  {isAdmin && (
                      <button 
                        onClick={() => onToggleVisibility(vac)}
                        className={`self-start md:self-center px-4 py-1 text-xs font-medium border rounded-lg whitespace-nowrap ${vac.isVisible ? 'text-gray-500 border-gray-200 hover:text-red-500' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
                      >
                        {vac.isVisible ? 'Ocultar Enfermedad' : 'Mostrar Enfermedad'}
                      </button>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PromotionsView = ({ vaccines, onSelect }) => {
  const promotedVaccines = vaccines.filter(v => v.promoted && v.isVisible);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#002F87] to-[#0071A3] p-8 rounded-xl shadow-lg text-white mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
          <TicketPercent size={200} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <TicketPercent size={40} className="text-[#8CC63F]" />
            <h2 className="text-3xl font-bold">Vacunas en Promoción</h2>
          </div>
          <p className="text-blue-100 text-lg max-w-2xl">
            Aprovecha los descuentos especiales disponibles este mes para afiliados y particulares. ¡La prevención es la mejor inversión!
          </p>
        </div>
      </div>

      {promotedVaccines.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {promotedVaccines.map(vac => (
              <VaccineCard key={vac.id} vac={vac} onClick={() => onSelect(vac)} />
            ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-[#8C9DA3]">No hay promociones activas en este momento.</p>
        </div>
      )}
    </div>
  );
};

const PediatricSchemeView = ({ vaccines, schedule, onSelectVaccine, isAdmin, onEditSchedule }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-[#002E58] flex items-center gap-2 mb-2">
          <Baby className="text-[#002F87]" /> Esquema Pediátrico
        </h2>
        <p className="text-[#8C9DA3]">Guía de vacunación por hitos de edad.</p>
      </div>

      <div className="space-y-4">
        {schedule.map((item, index) => {
          // Filtrar las vacunas que corresponden a este grupo de edad
          const groupVaccines = vaccines.filter(v => item.vaccineIds.includes(v.id) && v.isVisible);
          
          return (
            <details key={index} className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <summary className="flex items-center justify-between p-4 cursor-pointer list-none bg-[#F4F7F9] hover:bg-[#E1E8ED] transition-colors">
                <span className="font-bold text-[#002E58] flex items-center gap-3">
                  <CalendarCheck size={20} className="text-[#002F87]" />
                  {item.age}
                </span>
                <div className="flex items-center gap-3">
                  <ChevronDown className="text-[#0071A3] group-open:rotate-180 transition-transform" />
                </div>
              </summary>
              <div className="p-4 border-t border-gray-100">
                {isAdmin && (
                  <div className="mb-4">
                    <button 
                      onClick={() => onEditSchedule(item)}
                      className="text-xs bg-[#00B4E3]/10 text-[#0071A3] px-3 py-1.5 rounded-full font-bold flex items-center gap-1 hover:bg-[#00B4E3]/20 w-fit"
                    >
                      <Settings2 size={12} /> Gestionar Vacunas de {item.age}
                    </button>
                  </div>
                )}

                {groupVaccines.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {groupVaccines.map(vac => (
                      <VaccineCard 
                        key={vac.id} 
                        vac={vac} 
                        onClick={() => onSelectVaccine(vac)} 
                        minimal={true} 
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No hay biológicos configurados para este grupo.</p>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
};

const VaccinesListView = ({ vaccines, categoryFilter, onSelect, isAdmin, onToggleVisibility, onTogglePromo, onRequestDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredData = useMemo(() => {
    return vaccines.filter(vac => {
      if (!isAdmin && !vac.isVisible) return false;

      const matchesSearch = 
        vac.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        vac.prevention.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'Todos' || vac.category.toLowerCase().includes(categoryFilter.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter, vaccines, isAdmin]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2 className="text-xl font-bold text-[#002E58] flex items-center gap-2">
          <BriefcaseMedical className="text-[#002F87]" />
          {categoryFilter === 'Todos' ? 'Catálogo Completo' : `Biológicos: ${categoryFilter}`}
        </h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00B4E3] focus:border-transparent outline-none transition-all"
            placeholder="Buscar por nombre o enfermedad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isAdmin && (
        <div className="bg-[#8CC63F]/10 border border-[#8CC63F]/30 text-[#4E9D2D] px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <Edit3 size={16} />
          <span>Modo Edición Activo: Utilice los controles en las tarjetas para ocultar/mostrar o cambiar promociones. Haga clic en una tarjeta para editar su contenido.</span>
        </div>
      )}

      {filteredData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredData.map(vac => (
            <VaccineCard 
              key={vac.id} 
              vac={vac} 
              onClick={() => onSelect(vac)} 
              isAdmin={isAdmin}
              onToggleVisibility={onToggleVisibility}
              onTogglePromo={onTogglePromo}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-[#F4F7F9] rounded-xl border-2 border-dashed border-gray-200">
          <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No se encontraron resultados para "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

const LifecycleView = ({ onSelectCategory }) => {
  const groups = [
    { id: 'Pediátrica', title: 'Pediátrico', icon: Baby, color: 'bg-[#002F87]/5 text-[#002F87]', desc: 'Vacunas del esquema básico, recién nacidos e infancia temprana.' },
    { id: 'Adulto', title: 'Adulto y Adolescente', icon: Users, color: 'bg-[#00B288]/10 text-[#00B288]', desc: 'Refuerzos, VPH, Neumococo, Influenza y esquemas tardíos.' },
    { id: 'Viajero', title: 'Medicina del Viajero', icon: Plane, color: 'bg-[#00B4E3]/10 text-[#0071A3]', desc: 'Fiebre amarilla, Tifoidea, Hepatitis y profilaxis específicas.' },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#002E58]">Ciclo Vital</h2>
        <p className="text-[#8C9DA3]">Seleccione el grupo poblacional para filtrar los biológicos recomendados.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {groups.map(group => (
          <button 
            key={group.id}
            onClick={() => onSelectCategory(group.id)}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-[#002F87]/30 transition-all text-left flex flex-col h-full group"
          >
            <div className={`w-14 h-14 rounded-full ${group.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <group.icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-[#002E58] mb-2">{group.title}</h3>
            <p className="text-sm text-gray-600 flex-grow">{group.desc}</p>
            <div className="mt-4 flex items-center text-[#002F87] font-medium text-sm">
              Ver biológicos <ChevronRight size={16} className="ml-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

const LocationView = ({ isAdmin, locationData, onEdit }) => (
  <div className="max-w-4xl mx-auto space-y-6">
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 relative">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-[#002E58] flex items-center gap-2">
            <MapPin className="text-[#002F87]" /> Ubicación y Horarios
        </h2>
        {isAdmin && (
            <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2 bg-[#002F87] text-white rounded-lg text-sm font-bold hover:bg-[#002E58]">
                <Edit3 size={16}/> Editar Información
            </button>
        )}
      </div>
      
      <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-[#00B4E3]/10 p-3 rounded-lg text-[#0071A3]"><Clock size={24} /></div>
            <div>
              <h3 className="font-bold text-[#002E58] text-lg">Horario de Atención</h3>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li className="flex justify-between w-full md:w-80">
                  <span className="whitespace-pre-wrap">{locationData.hours}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-[#00B288]/10 p-3 rounded-lg text-[#00B288]"><MapIcon size={24} /></div>
            <div>
              <h3 className="font-bold text-[#002E58] text-lg">Dirección</h3>
              <p className="mt-1 text-gray-600">
                <strong>{locationData.placeName}</strong><br/>
                {locationData.address}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-[#002F87]/10 p-3 rounded-lg text-[#002F87]"><Phone size={24} /></div>
            <div>
              <h3 className="font-bold text-[#002E58] text-lg">Contacto Directo</h3>
              <p className="mt-1 text-gray-600 text-lg">Tel: <strong>{locationData.phone}</strong></p>
              <p className="text-gray-600">Extensión Vacunación: <strong>{locationData.ext}</strong></p>
            </div>
          </div>
      </div>
    </div>
  </div>
);

const FAQView = ({ isAdmin, faqs, onAdd, onEdit, onDelete }) => (
  <div className="max-w-3xl mx-auto">
    <div className="mb-6 text-center relative">
      <h2 className="text-2xl font-bold text-[#002E58]">Preguntas Frecuentes</h2>
      <p className="text-[#8C9DA3]">Respuestas rápidas para consultas comunes de pacientes.</p>
      {isAdmin && (
          <button onClick={onAdd} className="absolute right-0 top-0 mt-2 md:mt-0 px-4 py-2 bg-[#002F87] text-white rounded-lg text-sm font-bold hover:bg-[#002E58] flex items-center gap-2">
              <Plus size={16}/> Nueva Pregunta
          </button>
      )}
    </div>
    
    <div className="space-y-4">
      {faqs.map((item) => (
        <details key={item.id} className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
          <summary className="flex items-center justify-between p-5 cursor-pointer list-none bg-white hover:bg-[#F4F7F9] transition-colors pr-12">
            <span className="font-bold text-[#002E58] flex items-center gap-3">
              <HelpCircle size={20} className="text-[#00B4E3] flex-shrink-0" />
              {item.q}
            </span>
            <ChevronDown className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" />
          </summary>
          {isAdmin && (
              <div className="absolute top-4 right-12 flex gap-2">
                  <button onClick={() => onEdit(item)} className="p-1 text-gray-400 hover:text-[#002F87]" title="Editar"><Edit3 size={16}/></button>
                  <button onClick={() => onDelete(item.id)} className="p-1 text-gray-400 hover:text-red-500" title="Eliminar"><Trash2 size={16}/></button>
              </div>
          )}
          <div className="px-5 pb-5 pt-0 text-gray-600 leading-relaxed border-t border-gray-100 mt-2 pt-4 pl-12">
            {item.a}
          </div>
        </details>
      ))}
      {faqs.length === 0 && (
          <div className="text-center py-8 text-gray-400 italic border-2 border-dashed rounded-xl">
              No hay preguntas frecuentes registradas.
          </div>
      )}
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function VademecumApp() {
  const [currentView, setCurrentView] = useState('list');
  const [selectedCategory, setSelectedCategory] = useState('Todos'); 
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Modales nuevos
  const [editingLocation, setEditingLocation] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null); // null = cerrado, 'new' = nuevo, obj = editar
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Estados locales para nuevas funcionalidades
  const [locationData, setLocationData] = useState(() => {
      try { return JSON.parse(localStorage.getItem('locationData')) || initialLocationData; } 
      catch { return initialLocationData; }
  });

  const [faqs, setFaqs] = useState(() => {
      try { return JSON.parse(localStorage.getItem('faqs')) || initialFaqs; }
      catch { return initialFaqs; }
  });

  const [pediatricSchedule, setPediatricSchedule] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pediatricSchedule')) || initialPediatricSchedule; } 
    catch { return initialPediatricSchedule; }
  });

  const [editingScheduleItem, setEditingScheduleItem] = useState(null);

  // Helper para Toasts
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };
  
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // PERSISTENCIA LOCAL (Simulada para demo)
  useEffect(() => { localStorage.setItem('pediatricSchedule', JSON.stringify(pediatricSchedule)); }, [pediatricSchedule]);
  useEffect(() => { localStorage.setItem('locationData', JSON.stringify(locationData)); }, [locationData]);
  useEffect(() => { localStorage.setItem('faqs', JSON.stringify(faqs)); }, [faqs]);

  // Manejo de Auth State
  useEffect(() => {
    if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        });
        return () => unsubscribe();
    }
  }, []);

  // CONEXIÓN CON FIREBASE
  useEffect(() => {
    if (!db) {
      setVaccines(initialVaccineDatabase);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, "vaccines"), 
      (snapshot) => {
        if (snapshot.empty) setVaccines([]);
        else setVaccines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        console.warn("Fallback a local por error de permisos/conexión:", error);
        setVaccines(initialVaccineDatabase);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // CRUD HANDLERS
  const handleUpdateLocation = (newData) => {
      setLocationData(newData);
  };

  const handleSaveFaq = (faqData) => {
      if (editingFaq === 'new') {
          setFaqs(prev => [...prev, { ...faqData, id: Date.now() }]);
          showToast("Pregunta agregada", "success");
      } else {
          setFaqs(prev => prev.map(f => f.id === editingFaq.id ? { ...f, ...faqData } : f));
          showToast("Pregunta actualizada", "success");
      }
  };

  const handleDeleteFaq = (id) => {
      setConfirmModal({
          isOpen: true,
          title: "Eliminar Pregunta",
          message: "¿Estás seguro de que deseas eliminar esta pregunta?",
          onConfirm: () => {
              setFaqs(prev => prev.filter(f => f.id !== id));
              showToast("Pregunta eliminada", "info");
          }
      });
  };

  const seedDatabase = async () => {
    if (!db) {
        showToast("Firebase no configurado. Estás en modo local.", "error");
        return;
    }
    setConfirmModal({
        isOpen: true,
        title: "Cargar Base de Datos",
        message: "¿Seguro que deseas subir la base de datos inicial? Esto podría sobrescribir datos existentes.",
        onConfirm: async () => {
             try {
              for (const vac of initialVaccineDatabase) {
                await setDoc(doc(db, "vaccines", vac.id), vac);
              }
              showToast("Base de datos cargada exitosamente!", "success");
            } catch (e) {
              console.error(e);
              showToast("Error cargando base de datos: " + e.message, "error");
            }
        }
    });
  };

  const handleUpdateVaccine = async (updatedVac) => {
    if (db) {
      try {
        await updateDoc(doc(db, "vaccines", updatedVac.id), updatedVac);
        showToast("Cambios guardados", "success");
      } catch (e) {
        showToast("Error guardando cambios (Modo solo lectura en esta demo)", "error");
      }
    } else {
      setVaccines(prev => prev.map(v => v.id === updatedVac.id ? updatedVac : v));
      showToast("Cambio guardado localmente", "success");
    }
    setSelectedVaccine(updatedVac);
  };

  const handleAddVaccine = async (newVac) => {
    if (db) {
      try {
        await setDoc(doc(db, "vaccines", newVac.id), newVac);
        showToast("Biológico agregado exitosamente", "success");
      } catch (e) { showToast("Error: " + e.message, "error"); }
    } else {
      setVaccines(prev => [...prev, newVac]);
      showToast("Biológico agregado (Local)", "success");
    }
  };

  const handleDeleteRequest = (vac) => {
      setConfirmModal({
          isOpen: true,
          title: "Eliminar Biológico",
          message: `¿Estás seguro de eliminar ${vac.name} permanentemente?`,
          onConfirm: () => handleDeleteVaccine(vac)
      });
  };

  const handleDeleteVaccine = async (vac) => {
    if (db) {
      try {
        await deleteDoc(doc(db, "vaccines", vac.id));
        showToast("Biológico eliminado", "info");
      } catch (e) { showToast("Error: " + e.message, "error"); }
    } else {
      setVaccines(prev => prev.filter(v => v.id !== vac.id));
      showToast("Biológico eliminado (Local)", "info");
    }
  };

  const toggleVisibility = async (vac) => {
    if (db) {
      try {
        await updateDoc(doc(db, "vaccines", vac.id), { isVisible: !vac.isVisible });
      } catch (e) { showToast("Error: " + e.message, "error"); }
    } else {
      setVaccines(prev => prev.map(v => v.id === vac.id ? { ...v, isVisible: !v.isVisible } : v));
    }
  };

  const togglePromo = async (vac) => {
    if (db) {
      try {
        await updateDoc(doc(db, "vaccines", vac.id), { promoted: !vac.promoted });
      } catch (e) { showToast("Error: " + e.message, "error"); }
    } else {
      setVaccines(prev => prev.map(v => v.id === vac.id ? { ...v, promoted: !v.promoted } : v));
    }
  };

  const handleScheduleSave = (newVaccineIds) => {
    if (!editingScheduleItem) return;
    setPediatricSchedule(prev => prev.map(item => 
      item.age === editingScheduleItem.age 
        ? { ...item, vaccineIds: newVaccineIds } 
        : item
    ));
    setEditingScheduleItem(null);
    showToast("Esquema actualizado", "success");
  };

  const navItems = [
    { id: 'list', label: 'Biológicos Disponibles', icon: BriefcaseMedical },
    { id: 'promotions', label: 'Vacunas en Promoción', icon: TicketPercent },
    { id: 'diseases', label: 'Enfermedades Prevenibles', icon: Book },
    { id: 'lifecycle', label: 'Por Ciclo Vital', icon: Users },
    { id: 'location', label: 'Horarios y Ubicación', icon: MapPin },
    { id: 'faq', label: 'Preguntas Frecuentes', icon: HelpCircle },
  ];

  const handleNavClick = (viewId) => {
    setCurrentView(viewId);
    if (viewId === 'list') setSelectedCategory('Todos');
    setIsMobileMenuOpen(false);
  };

  const handleCategorySelect = (category) => {
    if (category === 'Pediátrica') {
      setCurrentView('pediatric_scheme');
    } else {
      setSelectedCategory(category);
      setCurrentView('list');
    }
  };

  const handleLogout = () => {
      if (auth) {
          signOut(auth).then(() => {
              showToast("Sesión cerrada", "info");
          });
      } else {
          setIsAdmin(false);
          showToast("Sesión local cerrada", "info");
      }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex font-sans text-slate-800">
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <aside className="hidden md:flex flex-col w-64 bg-[#002E58] text-white fixed h-full z-20 shadow-xl transition-all">
        <div className={`p-6 border-b ${isAdmin ? 'border-[#8CC63F] bg-[#002E58]' : 'border-[#002F87]'}`}>
          <div className="flex items-center gap-3 text-white mb-2">
            <BookOpen size={28} />
            <span className="font-bold text-xl tracking-tight">Vademécum</span>
          </div>
          <p className="text-xs text-[#8C9DA3] opacity-80 mb-2">Enfermería y Medicina</p>
          {isAdmin && <span className="text-[10px] bg-[#8CC63F] text-[#002E58] px-2 py-0.5 rounded font-bold uppercase">Modo Admin Activo</span>}
          {!db && (
            <div className="block mt-1 text-[10px] bg-gray-500 text-white px-2 py-1 rounded font-bold uppercase flex flex-col gap-1 w-fit">
                <span className="flex items-center gap-1"><WifiOff size={10}/> Modo Local</span>
                {firebaseError && <span className="text-[8px] opacity-75">{firebaseError}</span>}
            </div>
          )}
        </div>
        <nav className="flex-1 py-6 px-3 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentView === item.id 
                  ? 'bg-[#002F87] text-white shadow-md font-medium' 
                  : 'text-[#8C9DA3] hover:bg-[#002F87]/50 hover:text-white'
              }`}
            >
              <item.icon size={20} className={item.id === 'promotions' ? 'text-[#8CC63F]' : ''} />
              {item.label}
              {item.id === 'promotions' && (
                <span className="ml-auto bg-[#8CC63F] text-[#002E58] text-[10px] font-bold px-1.5 py-0.5 rounded">
                  %
                </span>
              )}
            </button>
          ))}
          
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#002F87]/50 border border-[#002F87] text-[#00B4E3] hover:bg-[#002F87] hover:text-white mt-4"
            >
              <Plus size={20} />
              Agregar Biológico
            </button>
          )}

        </nav>
        
        <div className="p-4 border-t border-[#002F87] space-y-2">
           {isAdmin && vaccines.length === 0 && !loading && db && (
            <button 
              onClick={seedDatabase}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium bg-[#002F87] text-white hover:bg-[#0071A3]"
            >
              <CloudUpload size={16} /> Cargar Base de Datos
            </button>
          )}

          <button 
            onClick={() => {
                if (isAdmin) {
                    handleLogout();
                } else {
                    setShowLoginModal(true);
                }
            }}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${isAdmin ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#002F87] text-[#00B4E3] hover:bg-[#0071A3] hover:text-white'}`}
          >
            {isAdmin ? (
              <> <LogOut size={16} /> Salir Admin </>
            ) : (
              <> <Lock size={16} /> Acceso Admin </>
            )}
          </button>
          <div className="mt-4 text-[10px] text-center text-[#8C9DA3]">
            v3.6 • Keralty ID
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-[#002E58] text-white z-30 shadow-md flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <BookOpen size={24} />
          <span className="font-bold">Vademécum {isAdmin && '(Admin)'}</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-[#002E58] z-20 pt-20 px-4 animate-in slide-in-from-top-10 flex flex-col">
          <nav className="space-y-4 flex-grow">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-lg ${
                  currentView === item.id 
                    ? 'bg-[#002F87] text-white font-bold border border-[#00B4E3]' 
                    : 'text-[#8C9DA3] border border-[#002F87]'
                }`}
              >
                <item.icon size={24} className={item.id === 'promotions' ? 'text-[#8CC63F]' : ''} />
                {item.label}
              </button>
            ))}
            {isAdmin && (
              <button
                onClick={() => { setIsMobileMenuOpen(false); setShowAddModal(true); }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-lg bg-[#002F87] border border-[#00B4E3] text-white"
              >
                <Plus size={24} />
                Agregar Biológico
              </button>
            )}
          </nav>
          <div className="pb-8 space-y-3">
             {isAdmin && vaccines.length === 0 && !loading && db && (
              <button 
                onClick={() => { seedDatabase(); setIsMobileMenuOpen(false); }}
                className="w-full py-3 rounded-xl text-lg font-bold flex items-center justify-center gap-2 bg-[#002F87] text-white"
              >
                <CloudUpload/> Cargar DB Inicial
              </button>
            )}
            <button 
              onClick={() => { setIsMobileMenuOpen(false); isAdmin ? handleLogout() : setShowLoginModal(true); }}
              className={`w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 ${isAdmin ? 'bg-red-500' : 'bg-[#002F87] text-[#00B4E3]'}`}
            >
               {isAdmin ? <><LogOut/> Cerrar Admin</> : <><Lock/> Admin</>}
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto min-h-screen">
        <div className="max-w-7xl mx-auto">
          {loading ? (
             <div className="flex items-center justify-center h-64 text-gray-500 flex-col gap-2">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#002F87]"></div>
               <p>Cargando información...</p>
             </div>
          ) : (
            <>
              {!db && (
                <div className="bg-[#8CC63F]/20 border-l-4 border-[#8CC63F] text-[#4E9D2D] p-4 mb-6 rounded shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-bold">Modo Demostración (Local)</p>
                    <p className="text-sm">Estás viendo datos de prueba. Configuración de Firebase pendiente.</p>
                  </div>
                  <WifiOff size={24} className="opacity-50"/>
                </div>
              )}

              {currentView === 'list' && (
                <VaccinesListView 
                  vaccines={vaccines}
                  categoryFilter={selectedCategory} 
                  onSelect={setSelectedVaccine} 
                  isAdmin={isAdmin}
                  onToggleVisibility={toggleVisibility}
                  onTogglePromo={togglePromo}
                  onRequestDelete={handleDeleteRequest}
                />
              )}

              {currentView === 'promotions' && (
                <PromotionsView vaccines={vaccines} onSelect={setSelectedVaccine} />
              )}

              {currentView === 'diseases' && (
                <DiseasesDictionaryView 
                    vaccines={vaccines} 
                    onSelectVaccine={setSelectedVaccine} 
                    isAdmin={isAdmin}
                    onToggleVisibility={toggleVisibility}
                />
              )}

              {currentView === 'pediatric_scheme' && (
                <PediatricSchemeView 
                  vaccines={vaccines} 
                  schedule={pediatricSchedule}
                  onSelectVaccine={setSelectedVaccine} 
                  isAdmin={isAdmin}
                  onEditSchedule={setEditingScheduleItem}
                />
              )}

              {currentView === 'lifecycle' && (
                <LifecycleView onSelectCategory={handleCategorySelect} />
              )}

              {currentView === 'location' && (
                <LocationView 
                    isAdmin={isAdmin} 
                    locationData={locationData} 
                    onEdit={() => setEditingLocation(true)}
                />
              )}

              {currentView === 'faq' && (
                <FAQView 
                    isAdmin={isAdmin}
                    faqs={faqs}
                    onAdd={() => setEditingFaq('new')}
                    onEdit={(item) => setEditingFaq(item)}
                    onDelete={handleDeleteFaq}
                />
              )}
            </>
          )}
        </div>
      </main>

      <DetailModal 
        vaccine={selectedVaccine} 
        onClose={() => setSelectedVaccine(null)} 
        isAdmin={isAdmin}
        onUpdate={handleUpdateVaccine}
      />

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLogin={() => setIsAdmin(true)}
        showToast={showToast}
      />

      <AddVaccineModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddVaccine}
        showToast={showToast}
      />

      <ScheduleEditModal 
        isOpen={!!editingScheduleItem}
        onClose={() => setEditingScheduleItem(null)}
        ageGroup={editingScheduleItem?.age}
        currentVaccineIds={editingScheduleItem?.vaccineIds}
        allVaccines={vaccines}
        onSave={handleScheduleSave}
      />

      <EditLocationModal 
        isOpen={editingLocation}
        onClose={() => setEditingLocation(false)}
        locationData={locationData}
        onSave={handleUpdateLocation}
        showToast={showToast}
      />

      <EditFAQModal 
        isOpen={!!editingFaq}
        onClose={() => setEditingFaq(null)}
        faq={editingFaq === 'new' ? null : editingFaq}
        onSave={handleSaveFaq}
      />
      
      <ConfirmationModal 
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}