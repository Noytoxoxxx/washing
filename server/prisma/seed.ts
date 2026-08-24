import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Veyza2026!";

const CATEGORIES = [
  { name: "Lavage", icon: "droplets" },
  { name: "Detailing", icon: "sparkles" },
  { name: "Nettoyage intérieur", icon: "wind" },
  { name: "Polish", icon: "sun" },
  { name: "Céramique", icon: "gem" },
  { name: "PPF", icon: "shield" },
  { name: "Covering", icon: "car" },
  { name: "Vitres teintées", icon: "eye" },
];

const PLANS = [
  { plan: "free", label: "Free", ratePercent: 0, priceMonthly: 0 },
  { plan: "pro", label: "Pro", ratePercent: 3, priceMonthly: 29 },
  { plan: "business", label: "Business", ratePercent: 1.5, priceMonthly: 49 },
  { plan: "founder", label: "Founding Partner", ratePercent: 5, priceMonthly: 0 },
];

function img(seed: string, w = 800, h = 600) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const PROFESSIONALS = [
  { key: "founder-auto", email: "founder@veyza.test", company: "Founder Auto Detailing", city: "Paris", postal: "75011", lat: 48.8583, lng: 2.3776, plan: "founder", isFounder: true, verified: true, status: "active" },
  { key: "lavage-pro", email: "pro@veyza.test", company: "Lavage Pro Paris", city: "Paris", postal: "75015", lat: 48.8422, lng: 2.2946, plan: "free", isFounder: false, verified: true, status: "active" },
  { key: "eclat-auto", email: "contact@eclat-auto.test", company: "Éclat Automobile", city: "Lyon", postal: "69003", lat: 45.7484, lng: 4.8467, plan: "founder", isFounder: true, verified: true, status: "active" },
  { key: "cleancar", email: "contact@cleancar-marseille.test", company: "CleanCar Marseille", city: "Marseille", postal: "13008", lat: 43.2669, lng: 5.3953, plan: "free", isFounder: false, verified: false, status: "active" },
  { key: "prestige-detailing", email: "contact@prestige-detailing.test", company: "Prestige Detailing", city: "Bordeaux", postal: "33000", lat: 44.8378, lng: -0.5792, plan: "pro", isFounder: false, verified: true, status: "active" },
  { key: "aquashine", email: "contact@aquashine.test", company: "AquaShine", city: "Lille", postal: "59000", lat: 50.6292, lng: 3.0573, plan: "business", isFounder: false, verified: true, status: "active" },
  { key: "brillance-auto", email: "contact@brillance-auto.test", company: "Brillance Auto", city: "Toulouse", postal: "31000", lat: 43.6047, lng: 1.4442, plan: "free", isFounder: false, verified: false, status: "pending" },
  { key: "nettoauto", email: "contact@nettoauto.test", company: "NettoAuto", city: "Nantes", postal: "44000", lat: 47.2184, lng: -1.5536, plan: "free", isFounder: false, verified: false, status: "suspended" },
  { key: "carspa-nice", email: "contact@carspa-nice.test", company: "CarSpa Nice", city: "Nice", postal: "06000", lat: 43.7102, lng: 7.262, plan: "founder", isFounder: true, verified: true, status: "active" },
  { key: "rapide-lavage", email: "contact@rapide-lavage.test", company: "Rapide Lavage", city: "Strasbourg", postal: "67000", lat: 48.5734, lng: 7.7521, plan: "free", isFounder: false, verified: true, status: "active" },
];

const SERVICE_TEMPLATES = [
  { name: "Lavage extérieur", duration: 30, price: 15 },
  { name: "Lavage complet intérieur/extérieur", duration: 60, price: 35 },
  { name: "Nettoyage intérieur approfondi", duration: 90, price: 55 },
  { name: "Polish carrosserie", duration: 120, price: 90 },
  { name: "Traitement céramique", duration: 240, price: 250 },
  { name: "Pose PPF partiel", duration: 300, price: 450 },
  { name: "Rénovation phares", duration: 45, price: 40 },
];

const CLIENT_NAMES = [
  ["Camille", "Durand"], ["Lucas", "Martin"], ["Chloé", "Bernard"], ["Nathan", "Petit"],
  ["Léa", "Robert"], ["Hugo", "Richard"], ["Manon", "Dubois"], ["Louis", "Moreau"],
  ["Emma", "Laurent"], ["Client", "Démo"],
];

const VEHICLE_MODELS = [
  ["Peugeot", "308"], ["Renault", "Clio"], ["BMW", "Série 3"], ["Audi", "A3"],
  ["Volkswagen", "Golf"], ["Mercedes", "Classe A"], ["Tesla", "Model 3"], ["Citroën", "C3"],
  ["Toyota", "Yaris"], ["Ford", "Fiesta"],
];

async function uniqueSlug(base: string) {
  const root = slugify(base, { lower: true, strict: true });
  let slug = root;
  let i = 1;
  while (await prisma.professionalProfile.findUnique({ where: { slug } })) {
    i += 1;
    slug = `${root}-${i}`;
  }
  return slug;
}

async function main() {
  console.log("Seeding VEYZA database...");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // Commission settings
  for (const p of PLANS) {
    await prisma.commissionSetting.upsert({ where: { plan: p.plan }, create: p, update: {} });
  }

  // Categories
  const categories = [];
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(c.name, { lower: true, strict: true }) },
      create: { name: c.name, slug: slugify(c.name, { lower: true, strict: true }), icon: c.icon },
      update: {},
    });
    categories.push(cat);
  }

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@veyza.test" },
    create: { email: "admin@veyza.test", passwordHash, firstName: "Admin", lastName: "VEYZA", role: "ADMIN" },
    update: {},
  });

  // Professionals
  const professionalProfiles = [];
  for (let i = 0; i < PROFESSIONALS.length; i++) {
    const p = PROFESSIONALS[i];
    const user = await prisma.user.upsert({
      where: { email: p.email },
      create: { email: p.email, passwordHash, firstName: p.company.split(" ")[0], lastName: "Pro", phone: `06${String(10000000 + i).slice(0, 8)}`, role: "PROFESSIONAL" },
      update: {},
    });

    let profile = await prisma.professionalProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      const slug = await uniqueSlug(p.company);
      profile = await prisma.professionalProfile.create({
        data: {
          userId: user.id,
          slug,
          companyName: p.company,
          description: `${p.company} est spécialisé dans l'entretien et l'embellissement automobile à ${p.city}. Notre équipe passionnée prend soin de votre véhicule avec des produits professionnels.`,
          logoUrl: img(`${p.key}-logo`, 200, 200),
          coverUrl: img(`${p.key}-cover`, 1200, 500),
          phone: `01${String(20000000 + i).slice(0, 8)}`,
          contactEmail: p.email,
          address: `${10 + i} rue de la Carrosserie`,
          city: p.city,
          postalCode: p.postal,
          latitude: p.lat,
          longitude: p.lng,
          instagram: p.key,
          tiktok: p.key,
          website: `https://${p.key}.example.com`,
          homeService: i % 3 === 0,
          serviceRadiusKm: 15,
          categoryId: categories[i % categories.length].id,
          status: p.status,
          verified: p.verified,
          isFounder: p.isFounder,
          founderSince: p.isFounder ? new Date(Date.now() - (30 + i) * 86400000) : null,
          subscriptionPlan: p.plan,
          onboardingStep: 7,
          profileCompletion: 100,
          viewCount: 40 + i * 17,
        },
      });

      // Business hours: closed Sunday, open Mon-Sat
      for (let d = 0; d < 7; d++) {
        await prisma.businessHour.create({
          data: { professionalId: profile.id, dayOfWeek: d, closed: d === 0, openTime: d === 0 ? null : d === 6 ? "09:00" : "08:30", closeTime: d === 0 ? null : d === 6 ? "13:00" : "18:30" },
        });
      }

      // Services (3 per professional -> 30 total)
      const templates = [SERVICE_TEMPLATES[i % SERVICE_TEMPLATES.length], SERVICE_TEMPLATES[(i + 2) % SERVICE_TEMPLATES.length], SERVICE_TEMPLATES[(i + 4) % SERVICE_TEMPLATES.length]];
      for (let s = 0; s < templates.length; s++) {
        await prisma.service.create({
          data: {
            professionalId: profile.id,
            categoryId: categories[(i + s) % categories.length].id,
            name: templates[s].name,
            description: `${templates[s].name} réalisé avec des produits professionnels haut de gamme.`,
            price: templates[s].price,
            durationMinutes: templates[s].duration,
            photoUrl: img(`${p.key}-service-${s}`, 600, 400),
            position: s,
          },
        });
      }

      // Gallery (4 images, one before/after pair)
      for (let g = 0; g < 4; g++) {
        await prisma.galleryImage.create({
          data: {
            professionalId: profile.id,
            url: img(`${p.key}-gallery-${g}`, 800, 800),
            position: g,
            isCover: g === 0,
            isBeforeAfter: g === 3,
            pairUrl: g === 3 ? img(`${p.key}-gallery-${g}-after`, 800, 800) : null,
          },
        });
      }
    }
    professionalProfiles.push(profile);
  }

  // Clients
  const clients = [];
  for (let i = 0; i < CLIENT_NAMES.length; i++) {
    const [firstName, lastName] = CLIENT_NAMES[i];
    const email = i === CLIENT_NAMES.length - 1 ? "client@veyza.test" : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@veyza.test`;
    const user = await prisma.user.upsert({
      where: { email },
      create: { email, passwordHash, firstName, lastName, phone: `07${String(30000000 + i).slice(0, 8)}`, role: "CLIENT" },
      update: {},
    });
    clients.push(user);
  }

  // Vehicles (one per client)
  const vehicles = [];
  for (let i = 0; i < clients.length; i++) {
    const [make, model] = VEHICLE_MODELS[i];
    const existing = await prisma.vehicle.findFirst({ where: { userId: clients[i].id } });
    const vehicle =
      existing ||
      (await prisma.vehicle.create({
        data: {
          userId: clients[i].id,
          make,
          model,
          year: 2018 + (i % 7),
          color: ["Blanc", "Noir", "Gris", "Bleu", "Rouge"][i % 5],
          mileage: 15000 + i * 8000,
          isPrimary: true,
          photoUrl: img(`vehicle-${i}`, 600, 400),
        },
      }));
    vehicles.push(vehicle);
  }

  // Bookings across statuses (15)
  const statuses = ["pending", "confirmed", "cancelled", "completed", "refused"];
  const existingBookingsCount = await prisma.booking.count();
  if (existingBookingsCount === 0) {
    for (let i = 0; i < 15; i++) {
      const professional = professionalProfiles[i % professionalProfiles.length]!;
      const services = await prisma.service.findMany({ where: { professionalId: professional.id } });
      const service = services[i % services.length];
      const client = clients[i % clients.length];
      const vehicle = vehicles[i % vehicles.length];
      const status = statuses[i % statuses.length];
      const dayOffset = status === "completed" || status === "cancelled" || status === "refused" ? -(i + 1) : i + 2;
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);

      const booking = await prisma.booking.create({
        data: {
          clientId: client.id,
          professionalId: professional.id,
          serviceId: service.id,
          vehicleId: vehicle.id,
          date,
          timeSlot: `${9 + (i % 8)}:00`,
          status,
          price: service.price,
        },
      });

      if (status === "completed") {
        await prisma.review.create({
          data: {
            bookingId: booking.id,
            professionalId: professional.id,
            clientId: client.id,
            rating: 3 + (i % 3),
            text: ["Très satisfait, travail impeccable !", "Bon rapport qualité/prix.", "Je recommande, équipe pro et sympathique."][i % 3],
          },
        });
        const rate = professional.commissionOverride ?? PLANS.find((p) => p.plan === professional.subscriptionPlan)?.ratePercent ?? 0;
        const commissionAmount = Math.round(service.price * (rate / 100) * 100) / 100;
        await prisma.transaction.create({
          data: {
            bookingId: booking.id,
            professionalId: professional.id,
            grossAmount: service.price,
            commissionRateApplied: rate,
            commissionAmount,
            netAmount: Math.round((service.price - commissionAmount) * 100) / 100,
            status: "paid",
          },
        });
      }
    }
  }

  // Posts (20) with likes/comments
  const existingPostsCount = await prisma.post.count();
  if (existingPostsCount === 0) {
    for (let i = 0; i < 20; i++) {
      const professional = professionalProfiles[i % professionalProfiles.length]!;
      const post = await prisma.post.create({
        data: {
          authorUserId: professional.userId,
          professionalId: professional.id,
          images: JSON.stringify([img(`post-${i}-a`, 900, 900), ...(i % 3 === 0 ? [img(`post-${i}-b`, 900, 900)] : [])]),
          description: ["Résultat du jour ✨", "Avant / après sur cette belle berline.", "Traitement céramique fraîchement posé.", "Un intérieur comme neuf !"][i % 4],
          hashtags: "#veyza #detailing #carcare",
          isBeforeAfter: i % 4 === 1,
        },
      });
      // A handful of likes per post
      for (let l = 0; l < (i % 5) + 1; l++) {
        const liker = clients[(i + l) % clients.length];
        await prisma.like.upsert({
          where: { postId_userId: { postId: post.id, userId: liker.id } },
          create: { postId: post.id, userId: liker.id },
          update: {},
        }).catch(() => {});
      }
      if (i % 3 === 0) {
        await prisma.comment.create({
          data: { postId: post.id, userId: clients[i % clients.length].id, text: "Superbe résultat !" },
        });
      }
    }
  }

  // Favorites & follows
  for (let i = 0; i < clients.length; i++) {
    const professional = professionalProfiles[i % professionalProfiles.length]!;
    await prisma.favorite
      .upsert({
        where: { userId_professionalId: { userId: clients[i].id, professionalId: professional.id } },
        create: { userId: clients[i].id, professionalId: professional.id },
        update: {},
      })
      .catch(() => {});
    await prisma.follow
      .upsert({
        where: { userId_professionalId: { userId: clients[i].id, professionalId: professional.id } },
        create: { userId: clients[i].id, professionalId: professional.id },
        update: {},
      })
      .catch(() => {});
  }

  // Notifications for demo client & demo founder pro
  const demoClient = clients[clients.length - 1];
  const founderUser = await prisma.user.findUnique({ where: { email: "founder@veyza.test" } });
  const notifTargets = [demoClient.id, founderUser?.id].filter(Boolean) as string[];
  for (const userId of notifTargets) {
    const existingNotif = await prisma.notification.findFirst({ where: { userId } });
    if (!existingNotif) {
      await prisma.notification.createMany({
        data: [
          { userId, type: "booking", title: "Réservation confirmée", message: "Votre réservation a été confirmée par le professionnel.", link: "/reservations", read: false },
          { userId, type: "follow", title: "Nouvel abonné", message: "Un utilisateur s'est abonné à votre profil.", link: "/pro/clients", read: true },
          { userId, type: "system", title: "Bienvenue sur VEYZA", message: "Merci de rejoindre le réseau VEYZA !", link: "/", read: true },
        ],
      });
    }
  }

  // Prospects for the recruitment CRM demo
  const prospectCount = await prisma.prospectLead.count();
  if (prospectCount === 0) {
    await prisma.prospectLead.createMany({
      data: [
        { businessName: "Éclat Motors", contactName: "Julien Faure", phone: "0611223344", email: "julien@eclatmotors.test", city: "Rennes", instagram: "eclatmotors", status: "to_contact", notes: "Repéré sur Instagram, beau feed avant/après." },
        { businessName: "ShinyCar Detailing", contactName: "Sarah Lemoine", phone: "0622334455", city: "Grenoble", tiktok: "shinycar", status: "contacted", notes: "Message envoyé le 20/08, en attente de réponse." },
        { businessName: "AutoGlow", contactName: "Karim Benali", email: "karim@autoglow.test", city: "Reims", status: "interested", notes: "Intéressé, rendez-vous téléphonique prévu." },
        { businessName: "Wash&Go Pro", contactName: "Léa Girard", city: "Angers", status: "refused", notes: "Ne souhaite pas rejoindre une plateforme pour le moment." },
      ],
    });
  }

  console.log("Seed complete.");
  console.log("Demo accounts (password: " + DEMO_PASSWORD + "):");
  console.log("  Admin      -> admin@veyza.test");
  console.log("  Founder    -> founder@veyza.test");
  console.log("  Pro        -> pro@veyza.test");
  console.log("  Client     -> client@veyza.test");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
