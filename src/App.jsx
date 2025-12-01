import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Info, Syringe, ShieldAlert, Calendar, X, Activity, 
  Filter, BookOpen, MapPin, Clock, Phone, HelpCircle, 
  Users, Baby, Plane, BriefcaseMedical, Menu, ChevronRight, ChevronDown, 
  Stethoscope, Book, TicketPercent, Lock, Unlock, Eye, EyeOff, Save, Edit3, CloudUpload, WifiOff, Plus, Trash2,
  CalendarCheck, Settings2, CheckSquare, Square
} from 'lucide-react';

// --- IMPORTAR FIREBASE ---
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, onSnapshot, doc, updateDoc, setDoc, getDocs, addDoc, deleteDoc 
} from "firebase/firestore";

// --- CONFIGURACIÓN DE FIREBASE (¡REEMPLAZAR CON TUS DATOS REALES!) ---
const firebaseConfig = {
  apiKey: "AIzaSyAeePk1erddZcP3LrLALMfjLeAIGtUzS5A",
  authDomain: "vademecum-keralty.firebaseapp.com",
  projectId: "vademecum-keralty",
  storageBucket: "vademecum-keralty.firebasestorage.app",
  messagingSenderId: "180320538220",
  appId: "1:180320538220:web:bf0d99772ea2cec7c85249"
};

// Inicializar Firebase de forma segura
let db = null;
try {
  if (firebaseConfig.apiKey !== "TU_API_KEY") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } else {
    console.log("Configuración de Firebase pendiente. Iniciando en modo local.");
  }
} catch (e) {
  console.warn("Error inicializando Firebase. Usando modo memoria.", e);
}

// --- COLORES CORPORATIVOS KERALTY (Manual V3 - Pág 17) ---
const KERALTY_COLORS = {
  blueDeep: '#002E58',   // Pantone 288 C (Fondos oscuros, Sidebar)
  blueMain: '#002F87',   // Pantone 287 C (Botones, Textos principales)
  blueLight: '#0071A3',  // Pantone 307 C (Subtítulos)
  cyan: '#00B4E3',       // Pantone 306 C (Acentos, Iconos)
  greenLight: '#8CC63F', // Pantone 376 C (Acentos, Activos)
  greenTeal: '#00B288',  // Pantone 339 C (Detalles)
  gray: '#8C9DA3',       // Pantone 400 C (Textos secundarios)
};

// --- BASE DE DATOS INICIAL (Respaldo Local) ---
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
    id: 'infanrixpenta',
    name: 'INFANRIX PENTA / PENTAXIM',
    type: 'Combinada',
    category: 'Pediátrica',
    prevention: 'Difteria, Tétanos, Tos ferina, Polio, Hib',
    diseaseDescription: 'Protección 5-en-1 contra múltiples patógenos (excluyendo Hep B).',
    scheme: 'Refuerzo a los 18 meses o esquema primario.',
    route: 'Intramuscular',
    complications: 'Llanto persistente, fiebre >38°C.',
    contraindications: 'Hipersensibilidad a componentes.',
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
    id: 'twinrix',
    name: 'TWINRIX',
    type: 'Viral',
    category: 'Viajero/Adulto',
    prevention: 'Hepatitis A y Hepatitis B',
    diseaseDescription: 'Protección dual hepática. Transmisión fecal-oral y por fluidos.',
    scheme: '0, 1, 6 meses. Esquema acelerado disponible.',
    route: 'Intramuscular',
    complications: 'Cefalea, fatiga.',
    contraindications: 'Hipersensibilidad.',
    promoted: false,
    isVisible: true
  },
  {
    id: 'menveo',
    name: 'MENVEO / MENACTRA / NIMENRIX',
    type: 'Bacteriana',
    category: 'Pediátrica/Adolescente',
    prevention: 'Meningococo (Serogrupos A, C, W, Y)',
    diseaseDescription: 'Enfermedad meningocócica invasiva: Meningitis y sepsis.',
    scheme: 'Variable según edad y marca.',
    route: 'Intramuscular',
    complications: 'Dolor muscular, cefalea.',
    contraindications: 'Síndrome de Guillain-Barré previo.',
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
    id: 'adacel',
    name: 'ADACEL / TETRAXIM',
    type: 'Bacteriana',
    category: 'Refuerzo',
    prevention: 'Difteria, Tétanos, Tos ferina',
    diseaseDescription: 'Refuerzo de inmunidad (Tdap) y protección capullo.',
    scheme: 'Refuerzo escolar o cada 10 años.',
    route: 'Intramuscular',
    complications: 'Dolor en el sitio.',
    contraindications: 'Encefalopatía previa.',
    promoted: false,
    isVisible: true
  },
  {
    id: 'avaxim',
    name: 'AVAXIM 160 / AVAXIM 80',
    type: 'Viral',
    category: 'Adulto/Pediátrico',
    prevention: 'Hepatitis A',
    diseaseDescription: 'Inflamación del hígado altamente contagiosa.',
    scheme: '2 Dosis separadas por 6-12 meses.',
    route: 'Intramuscular',
    complications: 'Dolor leve.',
    contraindications: 'Enfermedad febril aguda grave.',
    promoted: false,
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
  },
  {
    id: 'typhim',
    name: 'TYPHIM VI',
    type: 'Bacteriana',
    category: 'Viajero',
    prevention: 'Fiebre Tifoidea',
    diseaseDescription: 'Infección bacteriana sistémica por Salmonella Typhi.',
    scheme: 'Una dosis 2 semanas antes del viaje.',
    route: 'Intramuscular',
    complications: 'Dolor local.',
    contraindications: 'Hipersensibilidad.',
    promoted: false,
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
    id: 'verorab',
    name: 'VERORAB',
    type: 'Viral',
    category: 'Urgencia/Viajero',
    prevention: 'Rabia',
    diseaseDescription: 'Enfermedad viral mortal del sistema nervioso.',
    scheme: 'Pre o Post exposición (Protocolo médico).',
    route: 'Intramuscular',
    complications: 'Adenopatías, mareos.',
    contraindications: 'Ninguna en post-exposición.',
    alert: 'En post-exposición no hay contraindicaciones.',
    promoted: false,
    isVisible: true
  },
  {
    id: 'tetanico',
    name: 'T. TETÁNICO / TOXOIDE',
    type: 'Bacteriana',
    category: 'Urgencia',
    prevention: 'Tétanos',
    diseaseDescription: 'Rigidez muscular dolorosa por toxina bacteriana.',
    scheme: 'Manejo de heridas.',
    route: 'Intramuscular',
    complications: 'Nódulo en sitio de aplicación.',
    contraindications: 'Hipersensibilidad grave previa.',
    promoted: false,
    isVisible: true
  },
  {
    id: 'qdenga',
    name: 'QDENGA',
    type: 'Viral',
    category: 'Viajero/Endémica',
    prevention: 'Dengue',
    diseaseDescription: 'Enfermedad viral "rompehuesos" transmitida por mosquitos.',
    scheme: '2 dosis (0 y 3 meses).',
    route: 'Subcutánea',
    complications: 'Dolor en sitio, cefalea, mialgia.',
    contraindications: 'Embarazo, lactancia, inmunosupresión.',
    promoted: false,
    isVisible: true
  },
  {
    id: 'elovac',
    name: 'ELOVAC',
    type: 'Bacteriana',
    category: 'Otros',
    prevention: 'Infecciones Recurrentes (Lisado)',
    diseaseDescription: 'Inmunomodulador bacteriano.',
    scheme: 'Consultar ficha técnica.',
    route: 'Consultar',
    complications: 'Consultar.',
    contraindications: 'Consultar.',
    promoted: false,
    isVisible: true
  }
];

// --- PALETA KERALTY (Basada en Manual Identidad V3 - Pág 16/17) ---
const colorThemes = [
  // Azul Corporativo (Pantone 287 C) - Base principal
  { bg: 'bg-[#002F87]/5', border: 'border-[#002F87]/20', bar: 'bg-[#002F87]', text: 'text-[#002E58]', icon: 'text-[#002F87]', tag: 'bg-[#002F87]/10 text-[#002F87]' },
  // Verde Keralty (Pantone 376 C) - Acentos frescos
  { bg: 'bg-[#8CC63F]/5', border: 'border-[#8CC63F]/30', bar: 'bg-[#8CC63F]', text: 'text-[#002E58]', icon: 'text-[#8CC63F]', tag: 'bg-[#8CC63F]/10 text-[#4E9D2D]' },
  // Azul Cian (Pantone 306 C) - Bienestar
  { bg: 'bg-[#00B4E3]/5', border: 'border-[#00B4E3]/20', bar: 'bg-[#00B4E3]', text: 'text-[#002E58]', icon: 'text-[#00B4E3]', tag: 'bg-[#00B4E3]/10 text-[#0071A3]' },
  // Verde Teal (Pantone 339 C) - Salud
  { bg: 'bg-[#00B288]/5', border: 'border-[#00B288]/30', bar: 'bg-[#00B288]', text: 'text-[#002E58]', icon: 'text-[#00B288]', tag: 'bg-[#00B288]/10 text-[#007F60]' },
  // Azul Medio (Pantone 279 C) - Confianza
  { bg: 'bg-[#3E8EDE]/5', border: 'border-[#3E8EDE]/20', bar: 'bg-[#3E8EDE]', text: 'text-[#002E58]', icon: 'text-[#3E8EDE]', tag: 'bg-[#3E8EDE]/10 text-[#005C9E]' },
  // Gris Corporativo (Pantone 400 C) - Neutro/Elegante
  { bg: 'bg-slate-50', border: 'border-slate-200', bar: 'bg-[#8C9DA3]', text: 'text-[#002E58]', icon: 'text-[#8C9DA3]', tag: 'bg-slate-100 text-slate-600' },
];

const getThemeForVaccine = (index) => colorThemes[index % colorThemes.length];

const faqData = [
  { q: "¿Qué debo hacer si presento fiebre después de la vacuna?", a: "Es común presentar febrícula o fiebre leve (<38.5°C). Puede administrar antipiréticos (paracetamol) según indicación médica, hidratarse bien y usar paños tibios. Si la fiebre persiste más de 48 horas, consulte." },
  { q: "¿Puedo beber alcohol después de vacunarme?", a: "No hay una contraindicación absoluta, pero se recomienda evitar el exceso de alcohol las primeras 24-48 horas para no enmascarar posibles efectos adversos como dolor de cabeza o malestar." },
  { q: "¿Se pueden administrar varias vacunas el mismo día?", a: "Sí, la mayoría de las vacunas (inactivadas y vivas) se pueden administrar simultáneamente en sitios anatómicos diferentes sin riesgo adicional." },
  { q: "¿Qué hago si se me forma un bulto en el sitio de inyección?", a: "Puede aparecer un nódulo o induración. Generalmente desaparece solo en semanas. Si hay calor, rubor intenso o dolor severo, podría ser un absceso y requiere valoración médica." },
];

// --- DATOS INICIALES DE ESQUEMA PEDIÁTRICO (Semilla) ---
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

// --- COMPONENTES AUXILIARES ---

// MODAL PARA AGREGAR VACUNA NUEVA
const AddVaccineModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '', type: 'Viral', category: 'Adulto', prevention: '',
    diseaseDescription: '', scheme: '', route: 'Intramuscular',
    complications: '', contraindications: '', promoted: false, isVisible: true
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return alert("El nombre es obligatorio");
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

// MODAL PARA EDITAR ESQUEMA
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

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code === '1234') { 
      onLogin();
      onClose();
      setCode('');
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold text-[#002E58] mb-4 flex items-center gap-2">
          <Lock size={20} className="text-[#002F87]" />
          Acceso Administrativo
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código de Acceso</label>
            <input 
              type="password" 
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#00B4E3] outline-none"
              placeholder="Ingrese código..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-1">Código incorrecto. Intente '1234'</p>}
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-[#002F87] text-white rounded-lg hover:bg-[#002E58]">Ingresar</button>
          </div>
        </form>
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

const VaccineCard = ({ vac, onClick, isAdmin, onToggleVisibility, onTogglePromo, onDelete, minimal = false }) => {
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
              if(confirm('¿Estás seguro de eliminar este biológico permanentemente?')) onDelete(vac); 
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

const DiseasesDictionaryView = ({ vaccines, onSelectVaccine }) => {
  const visibleVaccines = vaccines.filter(v => v.isVisible);
  const sortedData = [...visibleVaccines].sort((a, b) => a.prevention.localeCompare(b.prevention));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-[#002E58] flex items-center gap-2 mb-2">
          <Book className="text-[#002F87]" /> Diccionario de Patologías
        </h2>
        <p className="text-[#8C9DA3]">Guía rápida de enfermedades prevenibles por vacunación.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedData.map((vac) => (
          <div key={vac.id} className="bg-white p-5 rounded-lg border-l-4 border-[#002F87] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                   <h3 className="text-lg font-bold text-[#002E58] mb-1">{vac.prevention}</h3>
                   {vac.promoted && <span className="text-xs bg-[#8CC63F]/20 text-[#4E9D2D] px-2 py-0.5 rounded font-bold border border-[#8CC63F]">Oferta</span>}
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{vac.diseaseDescription}</p>
                <div className="inline-flex items-center gap-2 bg-[#F4F7F9] text-[#002F87] px-3 py-1 rounded-full text-xs font-semibold">
                   Biológico: {vac.name}
                </div>
              </div>
              <button 
                onClick={() => onSelectVaccine(vac)}
                className="self-start md:self-center px-4 py-2 text-sm font-medium text-[#002F87] bg-white border border-gray-200 rounded-lg hover:bg-[#F4F7F9] whitespace-nowrap"
              >
                Ver Vacuna
              </button>
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

// NUEVA VISTA: Esquema Pediátrico Interactivo
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

const VaccinesListView = ({ vaccines, categoryFilter, onSelect, isAdmin, onToggleVisibility, onTogglePromo, onDelete }) => {
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
              onDelete={onDelete}
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

const LocationView = () => (
  <div className="max-w-4xl mx-auto space-y-6">
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-[#002E58] mb-6 flex items-center gap-2">
        <MapPin className="text-[#002F87]" /> Ubicación y Horarios
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-[#00B4E3]/10 p-3 rounded-lg text-[#0071A3]"><Clock size={24} /></div>
            <div>
              <h3 className="font-bold text-[#002E58] text-lg">Horario de Atención</h3>
              <ul className="mt-2 space-y-1 text-gray-600">
                <li className="flex justify-between w-full md:w-80">
                  <span className="font-medium">Todos los días:</span> 8:00 AM - 6:00 PM
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-[#00B288]/10 p-3 rounded-lg text-[#00B288]"><MapPin size={24} /></div>
            <div>
              <h3 className="font-bold text-[#002E58] text-lg">Dirección</h3>
              <p className="mt-1 text-gray-600">
                <strong>Centro Médico Colsanitas Premium Calle 96</strong><br/>
                Carrera 14 #96-22<br/>
                Bogotá, Colombia.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-[#002F87]/10 p-3 rounded-lg text-[#002F87]"><Phone size={24} /></div>
            <div>
              <h3 className="font-bold text-[#002E58] text-lg">Contacto Directo</h3>
              <p className="mt-1 text-gray-600 text-lg">Tel: <strong>5895455</strong></p>
              <p className="text-gray-600">Extensión Vacunación: <strong>5718033</strong></p>
            </div>
          </div>
        </div>

        <div className="bg-[#F4F7F9] rounded-xl h-64 md:h-full flex items-center justify-center border-2 border-dashed border-gray-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[#002E58]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <p className="text-[#002E58] font-bold">Abrir en Mapas</p>
          </div>
          <MapPin size={48} className="text-[#8C9DA3] mb-2" />
          <span className="text-[#8C9DA3] font-medium">Mapa de Ubicación</span>
        </div>
      </div>
    </div>
  </div>
);

const FAQView = () => (
  <div className="max-w-3xl mx-auto">
    <div className="mb-6 text-center">
      <h2 className="text-2xl font-bold text-[#002E58]">Preguntas Frecuentes</h2>
      <p className="text-[#8C9DA3]">Respuestas rápidas para consultas comunes de pacientes.</p>
    </div>
    
    <div className="space-y-4">
      {faqData.map((item, idx) => (
        <details key={idx} className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <summary className="flex items-center justify-between p-5 cursor-pointer list-none bg-white hover:bg-[#F4F7F9] transition-colors">
            <span className="font-bold text-[#002E58] flex items-center gap-3">
              <HelpCircle size={20} className="text-[#00B4E3]" />
              {item.q}
            </span>
            <ChevronDown className="text-gray-400 group-open:rotate-180 transition-transform" />
          </summary>
          <div className="px-5 pb-5 pt-0 text-gray-600 leading-relaxed border-t border-gray-100 mt-2 pt-4">
            {item.a}
          </div>
        </details>
      ))}
    </div>
  </div>
);

export default function VademecumApp() {
  const [currentView, setCurrentView] = useState('list');
  const [selectedCategory, setSelectedCategory] = useState('Todos'); 
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);

  // ESTADO PARA EL ESQUEMA PEDIÁTRICO
  const [pediatricSchedule, setPediatricSchedule] = useState(() => {
    // Intentar cargar esquema modificado del localStorage
    try {
      const savedSchedule = localStorage.getItem('pediatricSchedule');
      return savedSchedule ? JSON.parse(savedSchedule) : initialPediatricSchedule;
    } catch (e) {
      return initialPediatricSchedule;
    }
  });

  const [editingScheduleItem, setEditingScheduleItem] = useState(null); // Qué mes se está editando

  // CONEXIÓN CON FIREBASE
  useEffect(() => {
    if (!db) {
      setVaccines(initialVaccineDatabase);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, "vaccines"), 
      (snapshot) => {
        if (snapshot.empty) {
          setVaccines([]);
        } else {
          const vaccineList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setVaccines(vaccineList);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error conectando a Firebase:", error);
        setVaccines(initialVaccineDatabase);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Guardar esquema personalizado en LocalStorage
  useEffect(() => {
    localStorage.setItem('pediatricSchedule', JSON.stringify(pediatricSchedule));
  }, [pediatricSchedule]);

  const seedDatabase = async () => {
    if (!db) return alert("Firebase no configurado. Estás en modo local.");
    if (!confirm("¿Seguro que deseas subir la base de datos inicial? Esto podría sobrescribir datos.")) return;
    
    try {
      for (const vac of initialVaccineDatabase) {
        await setDoc(doc(db, "vaccines", vac.id), vac);
      }
      alert("Base de datos cargada exitosamente!");
    } catch (e) {
      console.error(e);
      alert("Error cargando base de datos: " + e.message);
    }
  };

  const handleUpdateVaccine = async (updatedVac) => {
    if (db) {
      try {
        await updateDoc(doc(db, "vaccines", updatedVac.id), updatedVac);
      } catch (e) {
        alert("Error guardando cambios: " + e.message);
      }
    } else {
      setVaccines(prev => prev.map(v => v.id === updatedVac.id ? updatedVac : v));
      alert("Cambio guardado localmente (Modo Demo).");
    }
    setSelectedVaccine(updatedVac);
  };

  const handleAddVaccine = async (newVac) => {
    if (db) {
      try {
        await setDoc(doc(db, "vaccines", newVac.id), newVac);
        alert("Biológico agregado exitosamente.");
      } catch (e) { alert("Error: " + e.message); }
    } else {
      setVaccines(prev => [...prev, newVac]);
      alert("Biológico agregado (Modo Demo).");
    }
  };

  const handleDeleteVaccine = async (vac) => {
    if (db) {
      try {
        await deleteDoc(doc(db, "vaccines", vac.id));
      } catch (e) { alert("Error: " + e.message); }
    } else {
      setVaccines(prev => prev.filter(v => v.id !== vac.id));
    }
  };

  const toggleVisibility = async (vac) => {
    if (db) {
      try {
        await updateDoc(doc(db, "vaccines", vac.id), { isVisible: !vac.isVisible });
      } catch (e) { alert("Error: " + e.message); }
    } else {
      setVaccines(prev => prev.map(v => v.id === vac.id ? { ...v, isVisible: !v.isVisible } : v));
    }
  };

  const togglePromo = async (vac) => {
    if (db) {
      try {
        await updateDoc(doc(db, "vaccines", vac.id), { promoted: !vac.promoted });
      } catch (e) { alert("Error: " + e.message); }
    } else {
      setVaccines(prev => prev.map(v => v.id === vac.id ? { ...v, promoted: !v.promoted } : v));
    }
  };

  // MANEJO DE EDICIÓN DE ESQUEMA
  const handleScheduleSave = (newVaccineIds) => {
    if (!editingScheduleItem) return;
    
    setPediatricSchedule(prev => prev.map(item => 
      item.age === editingScheduleItem.age 
        ? { ...item, vaccineIds: newVaccineIds } 
        : item
    ));
    setEditingScheduleItem(null);
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

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex font-sans text-slate-800">
      
      <aside className="hidden md:flex flex-col w-64 bg-[#002E58] text-white fixed h-full z-20 shadow-xl transition-all">
        <div className={`p-6 border-b ${isAdmin ? 'border-[#8CC63F] bg-[#002E58]' : 'border-[#002F87]'}`}>
          <div className="flex items-center gap-3 text-white mb-2">
            <BookOpen size={28} />
            <span className="font-bold text-xl tracking-tight">Vademécum</span>
          </div>
          <p className="text-xs text-[#8C9DA3] opacity-80 mb-2">Enfermería y Medicina</p>
          {isAdmin && <span className="text-[10px] bg-[#8CC63F] text-[#002E58] px-2 py-0.5 rounded font-bold uppercase">Modo Admin Activo</span>}
          {!db && <span className="block mt-1 text-[10px] bg-gray-500 text-white px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 w-fit"><WifiOff size={10}/> Modo Local</span>}
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
            onClick={() => isAdmin ? setIsAdmin(false) : setShowLoginModal(true)}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${isAdmin ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-[#002F87] text-[#00B4E3] hover:bg-[#0071A3] hover:text-white'}`}
          >
            {isAdmin ? (
              <> <Unlock size={16} /> Salir Admin </>
            ) : (
              <> <Lock size={16} /> Acceso Admin </>
            )}
          </button>
          <div className="mt-4 text-[10px] text-center text-[#8C9DA3]">
            v3.5 • Keralty ID
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
              onClick={() => { setIsMobileMenuOpen(false); isAdmin ? setIsAdmin(false) : setShowLoginModal(true); }}
              className={`w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 ${isAdmin ? 'bg-red-500' : 'bg-[#002F87] text-[#00B4E3]'}`}
            >
               {isAdmin ? <><Unlock/> Cerrar Admin</> : <><Lock/> Admin</>}
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
                    <p className="text-sm">Estás viendo datos de prueba. Para guardar cambios en la nube, configura las credenciales de Firebase en el código.</p>
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
                  onDelete={handleDeleteVaccine}
                />
              )}

              {currentView === 'promotions' && (
                <PromotionsView vaccines={vaccines} onSelect={setSelectedVaccine} />
              )}

              {currentView === 'diseases' && (
                <DiseasesDictionaryView vaccines={vaccines} onSelectVaccine={setSelectedVaccine} />
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
                <LocationView />
              )}

              {currentView === 'faq' && (
                <FAQView />
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
      />

      <AddVaccineModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddVaccine}
      />

      <ScheduleEditModal 
        isOpen={!!editingScheduleItem}
        onClose={() => setEditingScheduleItem(null)}
        ageGroup={editingScheduleItem?.age}
        currentVaccineIds={editingScheduleItem?.vaccineIds}
        allVaccines={vaccines}
        onSave={handleScheduleSave}
      />
    </div>
  );
}
