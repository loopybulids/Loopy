/**
 * Loopy's legal policies, as a single source of truth.
 *
 * Generated from Loopy-Policies.docx — the reviewed policy document — so the
 * site cannot drift from the signed-off wording. Every legal page renders from
 * this file; to change a policy, change the document and regenerate
 * (scratchpad/gen_legal.py) rather than editing a page.
 *
 * The document is five policies, each numbered from 1, and each naming the
 * route it belongs on. One page renders one policy; /legal renders them all.
 *
 * 6 policies, 55 sections, 150 paragraphs.
 */

export type LegalBlock = { kind: 'p' | 'li'; text: string };
export type LegalSection = { no: string; title: string; blocks: LegalBlock[] };
export type LegalPolicy = {
  /** Route without the slash — also the anchor id on /legal. */
  id: string;
  route: string;
  title: string;
  /** This policy's own date, which need not match the others'. */
  lastUpdated: string;
  intro: LegalBlock[];
  sections: LegalSection[];
};

/** Document-level facts, shown in the header of every policy page. */
export const LEGAL_META = {
  "site": "https://www.loopynow.shop",
  "contact": "loopynowshopsupport@gmail.com",
  "lastUpdated": "19 September 2026"
};

export const LEGAL_POLICIES: LegalPolicy[] = [
  {
    "id": "terms",
    "route": "/terms",
    "title": "Terms of Service",
    "lastUpdated": "19 September 2026",
    "intro": [],
    "sections": [
      {
        "no": "1",
        "title": "Who runs Loopy",
        "blocks": [
          {
            "kind": "p",
            "text": "1.1 Loopy (www.loopynow.shop) is operated from Mumbai, Maharashtra, India."
          },
          {
            "kind": "p",
            "text": "1.2 Loopy may transfer its business, and its rights and obligations under these Terms, to another person or entity, including a successor or acquirer. We will tell Users on the Platform or by email before the transfer takes effect, and the new operator will be bound by these Terms."
          },
          {
            "kind": "p",
            "text": "1.3 Nothing on the Platform claims that Loopy holds any licence or authorisation from any regulator, other than any we state expressly."
          }
        ]
      },
      {
        "no": "2",
        "title": "Meanings",
        "blocks": [
          {
            "kind": "li",
            "text": "Platform: the Loopy website and the checkout links, storefronts and order pages it provides."
          },
          {
            "kind": "li",
            "text": "User: anyone who uses the Platform."
          },
          {
            "kind": "li",
            "text": "Buyer: a person who places an Order."
          },
          {
            "kind": "li",
            "text": "Seller: a person who lists products or services on Loopy."
          },
          {
            "kind": "li",
            "text": "Order: a purchase made through the Platform."
          },
          {
            "kind": "li",
            "text": "Payment Provider: FamGateway, the service we use to collect UPI payments."
          },
          {
            "kind": "li",
            "text": "Platform Fee: the 5% fee charged to the Buyer on each Order."
          },
          {
            "kind": "li",
            "text": "Settlement Delay: the period of about 24 hours from when an Order is placed, during which Loopy holds the payment before releasing it to the Seller."
          }
        ]
      },
      {
        "no": "3",
        "title": "What Loopy is",
        "blocks": [
          {
            "kind": "p",
            "text": "3.1 Loopy is an online platform that connects Buyers and Sellers. The contract of sale is between the Buyer and the Seller. Loopy is not the seller of any product, does not own or handle the products, and does not guarantee their quality, safety, legality or delivery."
          },
          {
            "kind": "p",
            "text": "3.2 Loopy provides the tools for listing, checkout, payment collection and order tracking, and it collects and releases payments as set out in these Terms and in Selling on Loopy."
          }
        ]
      },
      {
        "no": "4",
        "title": "Who can use Loopy",
        "blocks": [
          {
            "kind": "p",
            "text": "4.1 You must be 18 or older and able to enter a binding contract to create an account or place an Order."
          },
          {
            "kind": "p",
            "text": "4.2 Orders placed without the account holder's authorisation, including by a minor, are dealt with under Refunds and Returns."
          }
        ]
      },
      {
        "no": "5",
        "title": "Accounts",
        "blocks": [
          {
            "kind": "p",
            "text": "5.1 Accounts are created with Google Sign-In. You are responsible for all activity on your account and for keeping your Google login secure."
          },
          {
            "kind": "p",
            "text": "5.2 Give accurate information. We may suspend or close accounts that give false information, break these Terms, or put other users at risk."
          }
        ]
      },
      {
        "no": "6",
        "title": "Fees and payments",
        "blocks": [
          {
            "kind": "p",
            "text": "6.1 Payments on Loopy are made by UPI only, through FamGateway. No other payment method is accepted."
          },
          {
            "kind": "p",
            "text": "6.2 The Platform Fee (5%) is shown to the Buyer at checkout and paid by the Buyer on top of the price. It is not deducted from the Seller's payout."
          },
          {
            "kind": "p",
            "text": "6.3 The Platform Fee is not refundable in any case, including cancellations, returns, refunds, failed deliveries and Orders cancelled by the Seller."
          },
          {
            "kind": "p",
            "text": "6.4 Loopy holds each payment for the Settlement Delay and then releases it to the Seller, unless a fraud check, legal requirement or wrong payout detail means we hold it longer. Payout details are in Selling on Loopy."
          },
          {
            "kind": "p",
            "text": "6.5 If a UPI payment is debited but the Order fails, we will start the reversal or refund within 7 business days of finding out. When the money reaches you depends on your bank or UPI app."
          },
          {
            "kind": "p",
            "text": "6.6 Loopy is not responsible or liable for any refund, return or cancellation. The Seller decides all of them, and the Seller's decision is final. Loopy only helps you reach the Seller and acts on the Seller's decision, as set out in Refunds and Returns."
          }
        ]
      },
      {
        "no": "7",
        "title": "Who is responsible for what",
        "blocks": [
          {
            "kind": "p",
            "text": "Matter"
          },
          {
            "kind": "p",
            "text": "Responsible"
          },
          {
            "kind": "p",
            "text": "Product description, price, quality, packing and dispatch"
          },
          {
            "kind": "p",
            "text": "Seller"
          },
          {
            "kind": "p",
            "text": "Delivery and courier choice"
          },
          {
            "kind": "p",
            "text": "Seller"
          },
          {
            "kind": "p",
            "text": "Collecting UPI payments and paying Sellers"
          },
          {
            "kind": "p",
            "text": "Loopy, through FamGateway"
          },
          {
            "kind": "p",
            "text": "Cancellation, return and refund decisions"
          },
          {
            "kind": "p",
            "text": "Seller only, and the Seller's decision is final"
          },
          {
            "kind": "p",
            "text": "Platform availability and account security"
          },
          {
            "kind": "p",
            "text": "Loopy"
          },
          {
            "kind": "p",
            "text": "Your own device, UPI app and bank account"
          },
          {
            "kind": "p",
            "text": "You"
          }
        ]
      },
      {
        "no": "8",
        "title": "Buyers",
        "blocks": [
          {
            "kind": "p",
            "text": "Buyers must give correct delivery details, be reachable for delivery, and pay by UPI from their own account or with the account holder's permission. Misuse, payment disputes raised in bad faith, or fraud can lead to suspension."
          }
        ]
      },
      {
        "no": "9",
        "title": "Sellers",
        "blocks": [
          {
            "kind": "p",
            "text": "Sellers agree to the Selling on Loopy page, which forms part of these Terms."
          }
        ]
      },
      {
        "no": "10",
        "title": "Content and conduct",
        "blocks": [
          {
            "kind": "p",
            "text": "10.1 Do not upload anything unlawful, misleading, infringing, offensive or harmful, and do not list prohibited products (see Selling on Loopy)."
          },
          {
            "kind": "p",
            "text": "10.2 Reviews must be genuine and based on a real Order. We may remove reviews that are fake, abusive or unlawful."
          },
          {
            "kind": "p",
            "text": "10.3 Do not take Buyers off the Platform to avoid fees, interfere with the Platform, scrape it, or attempt to defraud other users or Loopy."
          },
          {
            "kind": "p",
            "text": "10.4 To report unlawful content, email loopynowshopsupport@gmail.com. We act on valid reports and legal orders, and may remove content, cancel listings or suspend accounts that break these Terms or the law."
          }
        ]
      },
      {
        "no": "11",
        "title": "Intellectual property",
        "blocks": [
          {
            "kind": "p",
            "text": "Loopy's name, logo, design and software belong to Loopy. Sellers keep ownership of their own listings and content and give us a non-exclusive licence to display them on the Platform for as long as they are listed."
          }
        ]
      },
      {
        "no": "12",
        "title": "Liability",
        "blocks": [
          {
            "kind": "p",
            "text": "12.1 The Platform is provided \"as is\". We do not promise that it will always be available or free of errors."
          },
          {
            "kind": "p",
            "text": "12.2 To the extent the law allows, our total liability for any claim relating to an Order is limited to the amount the Buyer paid for that Order. We are not liable for indirect or consequential loss."
          },
          {
            "kind": "p",
            "text": "12.3 Nothing in these Terms removes rights you have under law that cannot be excluded by contract."
          },
          {
            "kind": "p",
            "text": "12.4 Loopy is not liable for delays or failures caused by events outside our reasonable control, including outages of UPI, banks or the Payment Provider."
          },
          {
            "kind": "p",
            "text": "12.5 You agree to compensate Loopy for losses caused by your breach of these Terms, your unlawful content or your unlawful sales."
          }
        ]
      },
      {
        "no": "13",
        "title": "Support and grievances",
        "blocks": [
          {
            "kind": "p",
            "text": "Grievance Officer, Loopy (Support Team)"
          },
          {
            "kind": "p",
            "text": "Email: loopynowshopsupport@gmail.com"
          },
          {
            "kind": "p",
            "text": "Mumbai, Maharashtra, India"
          },
          {
            "kind": "li",
            "text": "We acknowledge every complaint within 48 hours."
          },
          {
            "kind": "li",
            "text": "We aim to respond and resolve within 7 business days, and in any case within one month."
          },
          {
            "kind": "li",
            "text": "Please include your Order number and a description of the problem."
          }
        ]
      },
      {
        "no": "14",
        "title": "Changes to these Terms",
        "blocks": [
          {
            "kind": "p",
            "text": "We may update these Terms. For material changes we give at least 7 days' notice on the Platform or by email. Continuing to use Loopy after the change means you accept it."
          }
        ]
      },
      {
        "no": "15",
        "title": "Governing law",
        "blocks": [
          {
            "kind": "p",
            "text": "Indian law applies. Courts in Mumbai, Maharashtra have jurisdiction, subject to any consumer forum rights you have by law."
          }
        ]
      },
      {
        "no": "16",
        "title": "Contact",
        "blocks": [
          {
            "kind": "p",
            "text": "Support: loopynowshopsupport@gmail.com"
          }
        ]
      }
    ]
  },
  {
    "id": "privacy",
    "route": "/privacy",
    "title": "Privacy Policy",
    "lastUpdated": "19 September 2026",
    "intro": [],
    "sections": [
      {
        "no": "1",
        "title": "Who we are",
        "blocks": [
          {
            "kind": "p",
            "text": "Loopy (www.loopynow.shop) is operated from Mumbai, Maharashtra, India. Contact: loopynowshopsupport@gmail.com."
          }
        ]
      },
      {
        "no": "2",
        "title": "What we collect",
        "blocks": [
          {
            "kind": "li",
            "text": "Account data: name, email address and profile picture from Google Sign-In."
          },
          {
            "kind": "li",
            "text": "Order data: delivery name, address, phone number, order details, and the UPI transaction reference."
          },
          {
            "kind": "li",
            "text": "Seller data: business name, contact details, pickup and return address, and payout details (UPI ID or bank account) needed to pay you."
          },
          {
            "kind": "li",
            "text": "Support data: messages you send us and their contents."
          },
          {
            "kind": "li",
            "text": "Usage data: pages viewed, clicks, device and browser type and approximate location, collected by analytics built into Loopy itself."
          },
          {
            "kind": "p",
            "text": "We do not receive or store your UPI PIN or bank login. UPI payments are handled by the UPI app and Payment Provider you use."
          }
        ]
      },
      {
        "no": "3",
        "title": "Why we use it",
        "blocks": [
          {
            "kind": "li",
            "text": "To create accounts, process Orders and pay Sellers."
          },
          {
            "kind": "li",
            "text": "To run the Platform, prevent fraud and keep it secure."
          },
          {
            "kind": "li",
            "text": "To answer support requests and handle complaints."
          },
          {
            "kind": "li",
            "text": "To understand how Loopy is used and improve it, and to show Sellers statistics about their own listings and storefront."
          },
          {
            "kind": "li",
            "text": "To meet legal, tax and accounting obligations."
          }
        ]
      },
      {
        "no": "4",
        "title": "Who sees it",
        "blocks": [
          {
            "kind": "li",
            "text": "Sellers see the Buyer details needed to fulfil an Order (name, delivery address, phone, order contents). Sellers also see statistics about their own listings and storefront, such as views and orders. These do not identify individual visitors."
          },
          {
            "kind": "li",
            "text": "Couriers chosen by the Seller see delivery details."
          },
          {
            "kind": "li",
            "text": "FamGateway processes payment information."
          },
          {
            "kind": "li",
            "text": "Google provides sign-in. Google may process data outside India."
          },
          {
            "kind": "li",
            "text": "Authorities, where the law requires or a valid legal order is received."
          },
          {
            "kind": "p",
            "text": "We do not sell your personal data and we do not share it with advertisers."
          }
        ]
      },
      {
        "no": "5",
        "title": "Sellers' duties",
        "blocks": [
          {
            "kind": "p",
            "text": "Sellers may use Buyer data only to fulfil the Order, provide support for it and meet legal obligations. They must not sell it, market to Buyers without permission, or share it with others."
          }
        ]
      },
      {
        "no": "6",
        "title": "Cookies and analytics",
        "blocks": [
          {
            "kind": "p",
            "text": "We use cookies and similar storage that are needed to keep you signed in and the Platform working. Our analytics are built into Loopy and run on our own systems. We do not use third-party analytics or advertising cookies."
          }
        ]
      },
      {
        "no": "7",
        "title": "How long we keep it",
        "blocks": [
          {
            "kind": "li",
            "text": "Order and payment records: 8 years, to meet tax and accounting rules."
          },
          {
            "kind": "li",
            "text": "Support messages: 2 years."
          },
          {
            "kind": "li",
            "text": "Usage data: up to 2 years, then deleted or reduced to totals that identify no one."
          },
          {
            "kind": "li",
            "text": "Account data: while your account is active, then removed or anonymised unless we must keep it for the reasons above."
          }
        ]
      },
      {
        "no": "8",
        "title": "Your rights",
        "blocks": [
          {
            "kind": "p",
            "text": "You can ask to access, correct, update or erase your personal data, withdraw consent, or nominate another person to exercise these rights for you if you die or cannot act. Email loopynowshopsupport@gmail.com. We respond within 7 business days. Some records must be kept by law even after you ask for erasure."
          }
        ]
      },
      {
        "no": "9",
        "title": "Security",
        "blocks": [
          {
            "kind": "p",
            "text": "We use reasonable safeguards, including encrypted connections and access controls. No system is completely secure. If a breach affects your data, we will notify the people and authorities required by law."
          }
        ]
      },
      {
        "no": "10",
        "title": "Children",
        "blocks": [
          {
            "kind": "p",
            "text": "Loopy is for people aged 18 and over. We do not knowingly collect data from children. If you believe a child has given us data, contact us and we will delete it."
          }
        ]
      },
      {
        "no": "11",
        "title": "Complaints",
        "blocks": [
          {
            "kind": "p",
            "text": "Write to us first at loopynowshopsupport@gmail.com. If we do not resolve your complaint, you may complain to the Data Protection Board of India under the Digital Personal Data Protection Act, 2023."
          }
        ]
      },
      {
        "no": "12",
        "title": "Changes",
        "blocks": [
          {
            "kind": "p",
            "text": "We may update this policy and will post the new date at the top. For material changes we give notice on the Platform or by email."
          }
        ]
      }
    ]
  },
  {
    "id": "refunds",
    "route": "/refunds",
    "title": "Refunds and Returns",
    "lastUpdated": "19 September 2026",
    "intro": [],
    "sections": [
      {
        "no": "1",
        "title": "The short version",
        "blocks": [
          {
            "kind": "li",
            "text": "Loopy is not responsible or liable for any refund, return or cancellation."
          },
          {
            "kind": "li",
            "text": "The Seller decides every cancellation, return and refund, and the Seller's decision is final, every time."
          },
          {
            "kind": "li",
            "text": "Loopy only helps you reach the Seller and acts on the Seller's decision."
          },
          {
            "kind": "li",
            "text": "The 5% Platform Fee is never refunded."
          }
        ]
      },
      {
        "no": "2",
        "title": "How to ask for a cancellation, return or refund",
        "blocks": [
          {
            "kind": "p",
            "text": "2.1 Contact the Seller through the storefront or your order page. You can also email loopynowshopsupport@gmail.com with your Order number and a description of the problem, and we will pass your request to the Seller."
          },
          {
            "kind": "p",
            "text": "2.2 Ask within 7 days of delivery where possible, and include photos where relevant. Requests made later are at the Seller's discretion."
          }
        ]
      },
      {
        "no": "3",
        "title": "What Loopy does",
        "blocks": [
          {
            "kind": "li",
            "text": "We pass your request to the Seller within 7 business days."
          },
          {
            "kind": "li",
            "text": "We tell you the Seller's decision within 7 business days of your request."
          },
          {
            "kind": "li",
            "text": "We act on the Seller's decision as set out in section 4."
          },
          {
            "kind": "p",
            "text": "We do not decide whether a cancellation, return or refund is owed, and we do not refund from our own funds."
          }
        ]
      },
      {
        "no": "4",
        "title": "When the Seller approves",
        "blocks": [
          {
            "kind": "p",
            "text": "4.1 The Seller refunds you directly to the UPI ID or account you paid from. If Loopy is still holding the payment, we return it to you on the Seller's instruction."
          },
          {
            "kind": "p",
            "text": "4.2 An approved refund is started within 7 business days of approval. When it reaches you depends on your bank or UPI app."
          }
        ]
      },
      {
        "no": "5",
        "title": "When the Seller declines or does not respond",
        "blocks": [
          {
            "kind": "p",
            "text": "5.1 If the Seller declines, the Seller's decision stands and no refund is made."
          },
          {
            "kind": "p",
            "text": "5.2 If the Seller does not respond, we will remind the Seller and tell you where things stand. We cannot make the decision for the Seller."
          }
        ]
      },
      {
        "no": "6",
        "title": "Loopy's role and limits",
        "blocks": [
          {
            "kind": "p",
            "text": "Loopy is a platform, not the seller. We are not responsible for the quality, condition, safety, description or delivery of any product, or for any Seller decision. Loopy's help with a request does not make Loopy liable for the outcome."
          }
        ]
      },
      {
        "no": "7",
        "title": "Orders placed without authorisation",
        "blocks": [
          {
            "kind": "p",
            "text": "Loopy does not refund Orders placed without the account holder's authorisation, including Orders placed by a minor. You may ask the Seller to refund as a goodwill gesture and we will pass your request on."
          }
        ]
      },
      {
        "no": "8",
        "title": "Platform Fee",
        "blocks": [
          {
            "kind": "p",
            "text": "The 5% Platform Fee is not refundable in any case."
          }
        ]
      },
      {
        "no": "9",
        "title": "Your other rights",
        "blocks": [
          {
            "kind": "p",
            "text": "Nothing here affects any rights you have against the Seller, or against your bank or UPI app provider, under the law."
          }
        ]
      },
      {
        "no": "10",
        "title": "Contact",
        "blocks": [
          {
            "kind": "p",
            "text": "Grievance Officer, Loopy (Support Team)"
          },
          {
            "kind": "p",
            "text": "Email: loopynowshopsupport@gmail.com"
          },
          {
            "kind": "p",
            "text": "We acknowledge within 48 hours and aim to respond within 7 business days, and in any case within one month."
          }
        ]
      }
    ]
  },
  {
    "id": "shipping",
    "route": "/shipping",
    "title": "Shipping and Delivery",
    "lastUpdated": "19 September 2026",
    "intro": [],
    "sections": [
      {
        "no": "1",
        "title": "Who ships",
        "blocks": [
          {
            "kind": "p",
            "text": "Sellers ship their own products. Loopy does not store, pack or deliver goods."
          }
        ]
      },
      {
        "no": "2",
        "title": "Dispatch",
        "blocks": [
          {
            "kind": "p",
            "text": "2.1 Sellers must dispatch within 3 business days of receiving an Order, unless the listing states a different period."
          },
          {
            "kind": "p",
            "text": "2.2 Sellers must share tracking details where their courier provides them."
          }
        ]
      },
      {
        "no": "3",
        "title": "Delivery time",
        "blocks": [
          {
            "kind": "p",
            "text": "3.1 The delivery timeline is set by the Seller and shown at checkout or in the listing. It is an estimate."
          },
          {
            "kind": "p",
            "text": "3.2 If an Order arrives later than that timeline, you can ask the Seller for a cancellation, return or refund under Refunds and Returns. The Seller decides."
          }
        ]
      },
      {
        "no": "4",
        "title": "Delivery details",
        "blocks": [
          {
            "kind": "p",
            "text": "Buyers must give a complete and correct address and phone number. Loopy and the Seller are not responsible for failed deliveries caused by wrong or incomplete details."
          }
        ]
      },
      {
        "no": "5",
        "title": "Shipping charges",
        "blocks": [
          {
            "kind": "p",
            "text": "Shipping charges are set by the Seller and shown at checkout. Whether shipping charges are refunded is the Seller's decision."
          }
        ]
      },
      {
        "no": "6",
        "title": "Damage and non-delivery",
        "blocks": [
          {
            "kind": "p",
            "text": "If your Order arrives damaged or does not arrive, contact the Seller and follow Refunds and Returns. Take photos of the package and product where you can. The Seller decides what happens next."
          }
        ]
      }
    ]
  },
  {
    "id": "sellers-terms",
    "route": "/sellers-terms",
    "title": "Selling on Loopy",
    "lastUpdated": "19 September 2026",
    "intro": [
      {
        "kind": "p",
        "text": "These terms are part of the Terms of Service."
      }
    ],
    "sections": [
      {
        "no": "1",
        "title": "Becoming a Seller",
        "blocks": [
          {
            "kind": "p",
            "text": "1.1 You must be 18 or older and able to sell what you list."
          },
          {
            "kind": "p",
            "text": "1.2 Give accurate details: your name or business name, email, phone, pickup and return address, and UPI ID or bank account for payouts. We may ask for additional identity or tax information if the law requires."
          },
          {
            "kind": "p",
            "text": "1.3 You confirm that everything in your listings is accurate and that you have the right to sell the items."
          }
        ]
      },
      {
        "no": "2",
        "title": "Seller details shown to Buyers",
        "blocks": [
          {
            "kind": "p",
            "text": "Your business or seller name, contact details and dispatch location will be shown to Buyers on your listings and order pages, so that Buyers know who they are buying from."
          }
        ]
      },
      {
        "no": "3",
        "title": "Listings",
        "blocks": [
          {
            "kind": "p",
            "text": "Describe products honestly: price, condition, specifications, delivery timeline, and country of origin where relevant. Keep stock and prices up to date."
          }
        ]
      },
      {
        "no": "4",
        "title": "Prohibited products",
        "blocks": [
          {
            "kind": "p",
            "text": "You must not list any of the following:"
          },
          {
            "kind": "li",
            "text": "illegal items, counterfeits or stolen goods;"
          },
          {
            "kind": "li",
            "text": "weapons, ammunition and explosives;"
          },
          {
            "kind": "li",
            "text": "drugs, alcohol, tobacco and vaping products;"
          },
          {
            "kind": "li",
            "text": "adult content;"
          },
          {
            "kind": "li",
            "text": "items that infringe someone's intellectual property;"
          },
          {
            "kind": "li",
            "text": "anything you are not legally allowed to sell in India."
          },
          {
            "kind": "p",
            "text": "We may remove listings and suspend accounts."
          }
        ]
      },
      {
        "no": "5",
        "title": "Orders and shipping",
        "blocks": [
          {
            "kind": "p",
            "text": "Dispatch within 3 business days, share tracking details, pack items safely, and deliver in the timeline you promised. See Shipping and Delivery."
          }
        ]
      },
      {
        "no": "6",
        "title": "Payments and payouts",
        "blocks": [
          {
            "kind": "p",
            "text": "6.1 Buyers pay the price, shipping and the 5% Platform Fee by UPI through FamGateway."
          },
          {
            "kind": "p",
            "text": "6.2 Loopy holds the payment for the Settlement Delay (about 24 hours from when the Order is placed). During this time, if you approve a cancellation or refund, Loopy can return the money to the Buyer on your instruction."
          },
          {
            "kind": "p",
            "text": "6.3 After the Settlement Delay, Loopy releases the product price and shipping to you. The Platform Fee is charged to the Buyer and is not deducted from your payout."
          },
          {
            "kind": "p",
            "text": "6.4 We may hold a payout longer if there is a suspected fraud, a legal order, or a wrong or unclear payout detail, until it is resolved."
          },
          {
            "kind": "p",
            "text": "6.5 Wrong UPI or bank details you provide are your responsibility, and we are not liable for payouts made to details you gave us."
          }
        ]
      },
      {
        "no": "7",
        "title": "Cancellations, returns and refunds",
        "blocks": [
          {
            "kind": "p",
            "text": "7.1 You decide every cancellation, return and refund for your products, and your decision is final. Loopy only passes requests to you and acts on your decision. See Refunds and Returns."
          },
          {
            "kind": "p",
            "text": "7.2 Respond to requests within 3 business days."
          },
          {
            "kind": "p",
            "text": "7.3 If you approve a refund, pay it to the Buyer within 7 business days, or instruct Loopy to return it if the payment is still held. If you do not pay an approved refund within 7 business days, we may deduct it from your future payouts and pay it to the Buyer."
          },
          {
            "kind": "p",
            "text": "7.4 We may restrict a Seller account that repeatedly fails to respond to requests."
          }
        ]
      },
      {
        "no": "8",
        "title": "Analytics",
        "blocks": [
          {
            "kind": "p",
            "text": "Loopy shows you statistics about your own listings and storefront, such as views and orders. They are for your use in running your business and may not be used to identify or contact individual visitors."
          }
        ]
      },
      {
        "no": "9",
        "title": "Taxes",
        "blocks": [
          {
            "kind": "p",
            "text": "You are responsible for your own taxes and registrations, including any tax you charge Buyers. Loopy does not provide tax advice."
          }
        ]
      },
      {
        "no": "10",
        "title": "Buyer data",
        "blocks": [
          {
            "kind": "p",
            "text": "Use Buyer data only to fulfil Orders and give support, as set out in the Privacy Policy."
          }
        ]
      },
      {
        "no": "11",
        "title": "Suspension",
        "blocks": [
          {
            "kind": "p",
            "text": "We may suspend, restrict or close a Seller account, and hold payouts, for breach of these terms, fraud, repeated complaints or legal reasons."
          }
        ]
      }
    ]
  },
  {
    "id": "legal",
    "route": "/legal",
    "title": "All Policies",
    "lastUpdated": "19 September 2026",
    "intro": [
      {
        "kind": "li",
        "text": "Terms of Service: the rules for using Loopy."
      },
      {
        "kind": "li",
        "text": "Privacy Policy: what data we collect and how we use it."
      },
      {
        "kind": "li",
        "text": "Refunds and Returns: cancellations, returns, refunds and the Platform Fee."
      },
      {
        "kind": "li",
        "text": "Shipping and Delivery: dispatch, delivery times and shipping charges."
      },
      {
        "kind": "li",
        "text": "Selling on Loopy: rules, payments and payouts for Sellers."
      },
      {
        "kind": "p",
        "text": "Support and grievances: loopynowshopsupport@gmail.com. We acknowledge within 48 hours and aim to respond within 7 business days."
      }
    ],
    "sections": []
  }
];

/** One policy by its route (`/terms`) or id (`terms`). */
export function legalPolicy(key: string): LegalPolicy | undefined {
  const id = key.replace(/^\//, '');
  return LEGAL_POLICIES.find((p) => p.id === id);
}
