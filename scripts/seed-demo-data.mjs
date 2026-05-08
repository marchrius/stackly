import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_USER = {
  username: "demo",
  email: "demo@stackly.local",
  password: "demo12345",
};

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 12);

  if (dryRun) {
    console.log(JSON.stringify({
      mode: "dry-run",
      user: DEMO_USER.email,
      creates: {
        choiceLists: 1,
        templates: 1,
        collections: 2,
        items: 3,
        albums: 2,
        photos: 2,
      },
    }, null, 2));
    return;
  }

  const user = await prisma.user.upsert({
    where: { email: DEMO_USER.email },
    update: {
      username: DEMO_USER.username,
      password: passwordHash,
      enabled: true,
      roles: ["ROLE_USER"],
      locale: "en",
      currency: "EUR",
      visibility: "public",
      theme: "auto",
    },
    create: {
      username: DEMO_USER.username,
      email: DEMO_USER.email,
      password: passwordHash,
      enabled: true,
      roles: ["ROLE_USER"],
      locale: "en",
      currency: "EUR",
      visibility: "public",
      theme: "auto",
    },
  });

  await prisma.photo.deleteMany({ where: { ownerId: user.id } });
  await prisma.album.deleteMany({ where: { ownerId: user.id } });
  await prisma.item.deleteMany({ where: { ownerId: user.id } });
  await prisma.collection.deleteMany({ where: { ownerId: user.id } });
  await prisma.template.deleteMany({ where: { ownerId: user.id } });
  await prisma.choiceList.deleteMany({ where: { ownerId: user.id } });

  const conditionChoiceList = await prisma.choiceList.create({
    data: {
      name: "Condition",
      choices: ["Mint", "Near mint", "Good", "Used"],
      ownerId: user.id,
    },
  });

  const template = await prisma.template.create({
    data: {
      name: "Books and comics",
      ownerId: user.id,
      fields: {
        create: [
          { name: "Author", type: "text", position: 0, visibility: "public", ownerId: user.id },
          { name: "Publisher", type: "text", position: 1, visibility: "public", ownerId: user.id },
          { name: "Published on", type: "date", position: 2, visibility: "public", ownerId: user.id },
          { name: "Condition", type: "choice-list", position: 3, visibility: "public", ownerId: user.id, choiceListId: conditionChoiceList.id },
          { name: "Price", type: "price", position: 4, visibility: "public", ownerId: user.id },
        ],
      },
    },
    include: { fields: true },
  });

  const libraryCollection = await prisma.collection.create({
    data: {
      title: "Demo library",
      color: "#5B7FFF",
      visibility: "public",
      parentVisibility: "public",
      finalVisibility: "public",
      ownerId: user.id,
      itemsDefaultTemplateId: template.id,
    },
  });

  const sciFiCollection = await prisma.collection.create({
    data: {
      title: "Sci-fi shelf",
      color: "#7B5CFA",
      visibility: "public",
      parentVisibility: libraryCollection.finalVisibility,
      finalVisibility: "public",
      ownerId: user.id,
      parentId: libraryCollection.id,
      itemsDefaultTemplateId: template.id,
      data: {
        create: [
          {
            label: "Location",
            type: "text",
            value: "Living room",
            position: 0,
            visibility: "public",
            parentVisibility: "public",
            finalVisibility: "public",
          },
        ],
      },
    },
  });

  const dune = await prisma.item.create({
    data: {
      name: "Dune #1",
      quantity: 1,
      visibility: "public",
      parentVisibility: sciFiCollection.finalVisibility,
      finalVisibility: "public",
      ownerId: user.id,
      collectionId: sciFiCollection.id,
      scrapedFromUrl: "https://example.com/dune-1",
      data: {
        create: [
          datum("Author", "text", "Frank Herbert", 0),
          datum("Publisher", "text", "Ace", 1),
          datum("Published on", "date", "1965-08-01", 2),
          datum("Condition", "choice-list", JSON.stringify(["Near mint"]), 3, { choiceListId: conditionChoiceList.id }),
          datum("Price", "price", "19.90", 4, { currency: "EUR" }),
          datum("Notes", "textarea", "First volume of the classic saga.", 5),
        ],
      },
    },
  });

  const foundation = await prisma.item.create({
    data: {
      name: "Foundation",
      quantity: 1,
      visibility: "public",
      parentVisibility: sciFiCollection.finalVisibility,
      finalVisibility: "public",
      ownerId: user.id,
      collectionId: sciFiCollection.id,
      data: {
        create: [
          datum("Author", "text", "Isaac Asimov", 0),
          datum("Publisher", "text", "Gnome Press", 1),
          datum("Published on", "date", "1951-06-01", 2),
          datum("Condition", "choice-list", JSON.stringify(["Good"]), 3, { choiceListId: conditionChoiceList.id }),
          datum("Price", "price", "12.50", 4, { currency: "USD" }),
          datum("Awards", "list", JSON.stringify(["Hugo Retro Award", "Hall of fame"]), 5),
        ],
      },
    },
  });

  const watchmen = await prisma.item.create({
    data: {
      name: "Watchmen",
      quantity: 1,
      visibility: "public",
      parentVisibility: libraryCollection.finalVisibility,
      finalVisibility: "public",
      ownerId: user.id,
      collectionId: libraryCollection.id,
      data: {
        create: [
          datum("Author", "text", "Alan Moore", 0),
          datum("Publisher", "text", "DC Comics", 1),
          datum("Condition", "choice-list", JSON.stringify(["Mint"]), 2, { choiceListId: conditionChoiceList.id }),
          datum("Signed", "checkbox", "1", 3),
        ],
      },
    },
  });

  await prisma.item.update({
    where: { id: dune.id },
    data: { relatedItems: { connect: [{ id: foundation.id }, { id: watchmen.id }] } },
  });

  const album = await prisma.album.create({
    data: {
      title: "Demo travels",
      color: "#FF7A59",
      visibility: "public",
      parentVisibility: "public",
      finalVisibility: "public",
      ownerId: user.id,
    },
  });

  const japanAlbum = await prisma.album.create({
    data: {
      title: "Japan 2025",
      color: "#E84A5F",
      visibility: "public",
      parentVisibility: album.finalVisibility,
      finalVisibility: "public",
      ownerId: user.id,
      parentId: album.id,
    },
  });

  await prisma.photo.createMany({
    data: [
      {
        title: "Tokyo skyline",
        place: "Tokyo",
        comment: "Night walk around Shinjuku",
        visibility: "public",
        parentVisibility: japanAlbum.finalVisibility,
        finalVisibility: "public",
        ownerId: user.id,
        albumId: japanAlbum.id,
        takenAt: new Date("2025-04-10T20:30:00.000Z"),
      },
      {
        title: "Kyoto morning",
        place: "Kyoto",
        comment: "Early visit near Fushimi Inari",
        visibility: "public",
        parentVisibility: japanAlbum.finalVisibility,
        finalVisibility: "public",
        ownerId: user.id,
        albumId: japanAlbum.id,
        takenAt: new Date("2025-04-14T07:15:00.000Z"),
      },
    ],
  });

  console.log(JSON.stringify({
    seeded: true,
    user: { email: DEMO_USER.email, password: DEMO_USER.password },
    ids: {
      template: template.id,
      collections: [libraryCollection.id, sciFiCollection.id],
      items: [dune.id, foundation.id, watchmen.id],
      albums: [album.id, japanAlbum.id],
    },
  }, null, 2));
}

function datum(label, type, value, position, extra = {}) {
  return {
    label,
    type,
    value,
    position,
    visibility: "public",
    parentVisibility: "public",
    finalVisibility: "public",
    ...extra,
  };
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
