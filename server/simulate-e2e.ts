
import { db } from "./db";
import { bookings, services } from "@shared/schema";
import { eq } from "drizzle-orm";

async function simulateE2E() {
  const baseUrl = "http://localhost:5000";
  
  console.log("🚀 Iniciando Simulação E2E (Happy Path)...\n");

  // 1. Fetch Services (Simulate Loading Landing Page/Drawer)
  console.log("1. Buscando serviços...");
  const servicesRes = await fetch(`${baseUrl}/api/services`);
  if (!servicesRes.ok) throw new Error("Falha ao buscar serviços");
  const servicesData = await servicesRes.json();
  const serviceId = servicesData[0]?.id || 1;
  console.log(`   Serviço selecionado: ID ${serviceId} (${servicesData[0]?.name || 'Padrão'})\n`);

  // 2. Fetch Availability (Simulate Selecting Date)
  // Using a date sufficiently in the future to avoid 'past date' restrictions
  const targetDate = "2026-02-25"; 
  console.log(`2. Buscando disponibilidade para ${targetDate}...`);
  const availUrl = `${baseUrl}/api/availability?date=${targetDate}&serviceId=${serviceId}`;
  const availRes = await fetch(availUrl);
  if (!availRes.ok) throw new Error("Falha ao buscar disponibilidade");
  const slotsBefore = await availRes.json();
  
  if (slotsBefore.length === 0) {
    throw new Error("Nenhum horário disponível encontrado! Verifique se a data não está bloqueada ou no passado.");
  }
  
  const targetTime = slotsBefore[0];
  console.log(`   Horários disponíveis: ${slotsBefore.length}`);
  console.log(`   Horário escolhido para agendamento: ${targetTime}\n`);

  // 3. Create Booking (Simulate User Confirmation)
  console.log(`3. Criando agendamento para ${targetTime}...`);
  const bookingData = {
    customerName: "E2E Tester",
    customerEmail: "test@example.com",
    customerPhone: "11999999999",
    date: targetDate,
    time: targetTime,
    serviceId: serviceId
  };

  const createRes = await fetch(`${baseUrl}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookingData)
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Falha ao criar agendamento: ${createRes.status} - ${errText}`);
  }
  console.log("   Agendamento criado com sucesso (Status 201/200).\n");

  // 4. Verify Availability Update (Simulate Cache Invalidation Check)
  console.log("4. Verificando atualização de disponibilidade (Pós-agendamento)...");
  const availResAfter = await fetch(availUrl);
  const slotsAfter = await availResAfter.json();
  
  const isSlotGone = !slotsAfter.includes(targetTime);
  console.log(`   O horário ${targetTime} desapareceu da lista? ${isSlotGone ? "SIM ✅" : "NÃO ❌"}`);
  
  if (!isSlotGone) {
    console.error("   ERRO CRÍTICO: O horário ainda está disponível após o agendamento!");
  } else {
    console.log("   Validação de Consistência: OK.\n");
  }

  // 5. Verify Database (Admin Panel Check)
  console.log("5. Verificando registro no banco de dados...");
  const dbBooking = await db.query.bookings.findFirst({
    where: eq(bookings.customerEmail, "test@example.com")
  });

  if (dbBooking) {
    console.log(`   Registro encontrado no DB: ID ${dbBooking.id} | ${dbBooking.date} às ${dbBooking.time}`);
    console.log("   Validação de Persistência: OK.\n");
  } else {
    console.error("   ERRO CRÍTICO: Agendamento não encontrado no banco de dados!");
  }

  console.log("🏁 Simulação E2E concluída.");
  process.exit(0);
}

simulateE2E().catch(err => {
  console.error("\n❌ Erro fatal na simulação:", err);
  process.exit(1);
});
