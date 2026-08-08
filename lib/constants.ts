export const COLONY_BOIS_ASSETS = {
  logo: { src: "/assets/logo.png", alt: "Colony Bois Rampuram Ganesh Utsav Youth Logo" },
  heroIdol: { src: "/assets/hero-ganesha.jpg", alt: "Colony Bois Vinayaka Idol" },
  paymentQr: { src: "/assets/payment-qr.jpg", alt: "Colony Bois Direct PhonePe UPI Payment QR Code" },
} as const;

export const COLONY_BOIS_CONTACT = {
  platformName: "Colony Bois",
  tagline: "Ganesh Utsav Youth - Rampuram",
  email: "colonybois3@gmail.com",
  upiId: "9121429608@axl",
  instagram: {
    handle: "@colony_bois",
    url: "https://www.instagram.com/colony_bois?igsh=MWdtaWdkN3VmeHprZA==",
  },
  phoneNumbers: [
    { label: "Organizer 1", number: "+919121429608", display: "+91 91214 29608" },
    { label: "Organizer 2", number: "+918106565698", display: "+91 81065 65698" },
    { label: "Organizer 3", number: "+917997752156", display: "+91 79977 52156" },
  ],
  pandalLocation: {
    title: "Colony Bois Vinayaka Pandal",
    mapsUrl: "https://maps.app.goo.gl/ZNFj8VaJ85W3EfYe6?g_st=aw",
  },
} as const;
