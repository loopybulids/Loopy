/**
 * Loopy's legal policies, as a single source of truth.
 *
 * Generated from Loopy_Legal_Policies.docx — the reviewed policy document — so
 * the site cannot drift from the signed-off wording. Every legal page renders
 * from this file; to change a policy, change the document and regenerate
 * (scratchpad/gen_legal.py) rather than editing a page.
 *
 * 18 Articles, 51 Sections, 176 paragraphs.
 */

export type LegalBlock = { kind: 'p' | 'li'; text: string };
export type LegalSubsection = { no: string; title: string; blocks: LegalBlock[] };
export type LegalSection = {
  n: number;
  id: string;
  title: string;
  intro: LegalBlock[];
  subs: LegalSubsection[];
};

/** Document-level facts, shown in the header of every policy page. */
export const LEGAL_META = {
  "site": "https://www.loopynow.shop",
  "contact": "loopynowshopsupport@gmail.com",
  "lastUpdated": "18 September 2026",
  "operators": "Zohan Alam (Founder) and Ankit Sah (Co-Founder) , Subhash Raj (Tech Lead) trading as Loopy from Mumbai, Maharashtra, India",
  "grievanceOfficer": "Ankit Sah",
  "structureNote": "This document is structured as numbered Articles and Sections (e.g. Article 6, Section 6.3) for ease of reference and citation.",
  "blurb": "Every policy that governs the use of Loopy, in one document. It covers who we are, what we do and do not do, how orders and payments work, and how to reach us if something goes wrong."
};

/**
 * The document's own plain-language summary for buyers.
 *
 * Kept as its own export because it is deliberately not a policy: it says so
 * itself, and the page has to present it as a summary rather than as terms.
 */
export const LEGAL_GLANCE: string[] = [
  "Loopy is a marketplace, not the Seller. Your contract of sale is with the Seller, not with Loopy (Article 3.1).",
  "You must be 18 or older to create an account or place an Order (Article 3.2).",
  "A platform fee of 5% is added at checkout and is not refundable, even if your Order is cancelled or returned (Article 6.2).",
  "Refunds and cancellations are the Seller's call — except where the product was never delivered, is defective, wrong, or counterfeit, where Loopy will enforce a refund regardless of the Seller's decision (Article 9.2–9.3).",
  "Sellers are paid roughly 24 hours after your Order is placed. You can still cancel, request a refund or raise a dispute during that window (Article 6.3).",
  "Loopy does not ship, store or inspect products — delivery timelines and product quality are the Seller's responsibility, not ours (Article 7).",
  "If something goes wrong, our grievance officer is Ankit Sah, reachable at loopynowshopsupport@gmail.com (Article 11.1)."
];

export const LEGAL_SECTIONS: LegalSection[] = [
  {
    "n": 1,
    "id": "who-operates-loopy",
    "title": "Who Operates Loopy",
    "intro": [],
    "subs": [
      {
        "no": "1.1",
        "title": "The Operator",
        "blocks": [
          {
            "kind": "p",
            "text": "Loopy is an early-stage platform. It is currently operated by its founding team — Zohan Alam (Founder) and Ankit Sah (Co-Founder) , Subhash Raj (Tech Lead) trading as Loopy from Mumbai, Maharashtra, India. Loopy is not yet incorporated as a company or an LLP. Zohan Alam holds final decision-making authority for the business; Ankit Sah makes and assists with decisions in other matters, including as the grievance officer named in Article 11."
          }
        ]
      },
      {
        "no": "1.2",
        "title": "Registration of a Legal Entity",
        "blocks": [
          {
            "kind": "p",
            "text": "We are in the process of registering a legal entity and expect to complete this by [MONTH, YEAR — estimate, confirm before publishing]. When we do, this page will be updated with the registered name, registration number and registered office, and the agreement between you and the operator will continue with that entity. We say this plainly so that you know exactly who you are dealing with."
          }
        ]
      },
      {
        "no": "1.3",
        "title": "Interpretation",
        "blocks": [
          {
            "kind": "p",
            "text": "Throughout this document, \"Loopy\", \"we\", \"us\" and \"our\" mean the operator named above. Nothing in this document should be read as a claim that Loopy holds any licence, registration, certification or regulatory approval that it does not in fact hold."
          }
        ]
      }
    ]
  },
  {
    "n": 2,
    "id": "definitions",
    "title": "Definitions",
    "intro": [
      {
        "kind": "p",
        "text": "These meanings apply throughout this document."
      },
      {
        "kind": "p",
        "text": "Platform — the Loopy website at www.loopynow.shop and any app or service we operate in connection with it."
      },
      {
        "kind": "p",
        "text": "User — anyone who uses the Platform, whether as a Buyer or a Seller."
      },
      {
        "kind": "p",
        "text": "Buyer — a User who places an Order through the Platform."
      },
      {
        "kind": "p",
        "text": "Seller — a User who registers to list and sell products through the Platform."
      },
      {
        "kind": "p",
        "text": "Listing — a product, description, image, price or offer published by a Seller."
      },
      {
        "kind": "p",
        "text": "Order — a Buyer's confirmed purchase of one or more Listings."
      },
      {
        "kind": "p",
        "text": "Payment Provider — FamGateway, the third-party payment gateway we use to collect payments from Buyers and to pay Sellers."
      },
      {
        "kind": "p",
        "text": "Settlement — the payout of an Order's proceeds, net of fees and deductions, to the Seller."
      },
      {
        "kind": "p",
        "text": "Settlement Delay — the period of approximately 24 hours after an Order is placed before that Order becomes eligible for Settlement, described in Article 6."
      },
      {
        "kind": "p",
        "text": "Applicable Law — the laws of India, including the Consumer Protection Act, 2019 and rules made under it, the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023."
      }
    ],
    "subs": []
  },
  {
    "n": 3,
    "id": "terms-of-use",
    "title": "Terms of Use",
    "intro": [
      {
        "kind": "p",
        "text": "By using the Platform, placing an Order or listing a product, you agree to this document. If you do not agree, please do not use the Platform."
      }
    ],
    "subs": [
      {
        "no": "3.1",
        "title": "What Loopy Is",
        "blocks": [
          {
            "kind": "p",
            "text": "Loopy is a marketplace. Sellers are independent businesses and individuals. When you buy something on Loopy, the contract of sale is between you and that Seller. Loopy is not the seller, manufacturer, importer or distributor of the products listed, and does not take physical possession of any product at any point."
          },
          {
            "kind": "p",
            "text": "What Loopy provides is the Platform itself: the ability to discover Listings, place and track Orders, communicate about an Order, and get help from our support team. We are responsible for those services and for how we operate the Platform. We are not a guarantor or insurer of what a Seller or Buyer does."
          }
        ]
      },
      {
        "no": "3.2",
        "title": "Who Can Use Loopy",
        "blocks": [
          {
            "kind": "p",
            "text": "You must be at least 18 years old to create an account, place an Order or list a product. Anyone may browse the Platform, but accounts and transactions are restricted to adults who can enter into a binding contract under the Indian Contract Act, 1872. We do not knowingly collect personal information from anyone under 18. If you believe a minor has used an account or a payment method without authorisation, contact us and we will act on it — see Article 9."
          }
        ]
      },
      {
        "no": "3.3",
        "title": "Your Account",
        "blocks": [
          {
            "kind": "p",
            "text": "Accounts are created using Google Sign-In. Keep your credentials secure; you are responsible for activity under your account. Give us accurate information and keep it current. We may suspend or close an account that contains false or unverifiable information, that breaches this document, or where we are required to do so by law. Where it is practical to do so, we will tell you why first and give you a chance to respond."
          },
          {
            "kind": "p",
            "text": "You can close your account at any time by emailing us, once any open Orders, Settlements or complaints are resolved."
          }
        ]
      },
      {
        "no": "3.4",
        "title": "Intellectual Property",
        "blocks": [
          {
            "kind": "p",
            "text": "The Loopy name, logo, site design and software belong to the operator. Sellers keep ownership of the content they upload, and grant us permission to display and reproduce it on the Platform and to promote the Platform, for as long as the Listing is live and for a reasonable period afterwards for our records. If you believe a Listing infringes your intellectual property, write to us with details and we will review and act on it."
          }
        ]
      },
      {
        "no": "3.5",
        "title": "Changes to This Document",
        "blocks": [
          {
            "kind": "p",
            "text": "We may update this document as the Platform develops or as the law requires. If a change materially affects you, we will give notice on the Platform or by email at least seven days before it takes effect. Using the Platform after that date means you accept the updated version. Earlier versions are available on request."
          }
        ]
      }
    ]
  },
  {
    "n": 4,
    "id": "buyer-terms",
    "title": "Buyer Terms",
    "intro": [],
    "subs": [
      {
        "no": "4.1",
        "title": "Providing Your Details",
        "blocks": [
          {
            "kind": "p",
            "text": "To place an Order you give us your name, phone number and delivery address. We pass those details to the Seller fulfilling your Order so that it can be delivered, and handle them as described in Article 12."
          }
        ]
      },
      {
        "no": "4.2",
        "title": "Order Confirmation",
        "blocks": [
          {
            "kind": "p",
            "text": "Your Order is confirmed once payment has been successfully processed. You will get an Order confirmation, and tracking information once the Seller dispatches it."
          }
        ]
      },
      {
        "no": "4.3",
        "title": "Your Obligations as a Buyer",
        "blocks": [
          {
            "kind": "p",
            "text": "Before you buy, read the Listing — including the Seller's own return and delivery terms, which may differ between Sellers. Please also:"
          },
          {
            "kind": "li",
            "text": "give accurate delivery details, and be reasonably available to receive delivery;"
          },
          {
            "kind": "li",
            "text": "check the product when it arrives and raise any problem promptly, as set out in Article 9;"
          },
          {
            "kind": "li",
            "text": "pay using a payment method you are authorised to use;"
          },
          {
            "kind": "li",
            "text": "use the Platform lawfully, and not to defraud a Seller."
          },
          {
            "kind": "p",
            "text": "Repeated unfounded refund or dispute claims may lead us to restrict your account. Nothing in this Article removes any right you have as a consumer under Applicable Law."
          }
        ]
      }
    ]
  },
  {
    "n": 5,
    "id": "seller-terms",
    "title": "Seller Terms",
    "intro": [
      {
        "kind": "p",
        "text": "These terms apply to every Seller in addition to the rest of this document."
      }
    ],
    "subs": [
      {
        "no": "5.1",
        "title": "Registering as a Seller",
        "blocks": [
          {
            "kind": "p",
            "text": "To sell on Loopy you must give us, and keep current:"
          },
          {
            "kind": "li",
            "text": "your full legal name or registered business name, and your business or operating address;"
          },
          {
            "kind": "li",
            "text": "a working email address and phone number for customer contact;"
          },
          {
            "kind": "li",
            "text": "your GSTIN, where you are required to be registered under GST law, and your PAN;"
          },
          {
            "kind": "li",
            "text": "settlement details — a UPI ID, or a bank account number with IFSC and account holder name."
          },
          {
            "kind": "p",
            "text": "Some of this information is displayed to Buyers on your Listings, because Applicable Law requires a marketplace to show who the seller is. We may verify your details before activating your account or releasing a Settlement, and may re-verify later. Giving us false or mismatched details is a serious breach of these terms and may result in suspension and in Settlement being withheld until the matter is resolved."
          }
        ]
      },
      {
        "no": "5.2",
        "title": "Your Listings",
        "blocks": [
          {
            "kind": "p",
            "text": "You are responsible for everything in your Listings: descriptions, images, pricing, stock, delivery timelines, any warranty you offer, and your return policy. Listings must be accurate, must not mislead, and must comply with Article 14. You are responsible for holding any licence that the law requires for what you sell. We may remove or edit a Listing that appears to breach these terms or the law, and will tell you where we reasonably can."
          }
        ]
      },
      {
        "no": "5.3",
        "title": "Fulfilment",
        "blocks": [
          {
            "kind": "p",
            "text": "You pack, dispatch and ship every Order you accept, using your own courier. You must update the Order status and tracking information on the Platform promptly after dispatch. Repeated failure to dispatch, to update tracking, or to respond to Buyers is a breach of these terms."
          }
        ]
      },
      {
        "no": "5.4",
        "title": "Tax",
        "blocks": [
          {
            "kind": "p",
            "text": "You are responsible for your own tax position: determining, charging, collecting and remitting GST, income tax and any other tax on your sales, and holding the registrations the law requires. We do not give tax advice. Where Applicable Law requires Loopy to register, to collect tax at source on supplies made through the Platform, or to report those supplies, Loopy will do so and will reflect any such collection in your Settlement statement."
          }
        ]
      },
      {
        "no": "5.5",
        "title": "Conduct",
        "blocks": [
          {
            "kind": "p",
            "text": "Do not manipulate reviews or ratings, misrepresent products, use another Seller's content without permission, or route Buyers off the Platform to avoid fees. Breach may lead to suspension under Article 3."
          }
        ]
      }
    ]
  },
  {
    "n": 6,
    "id": "payments-and-settlement",
    "title": "Payments and Settlement",
    "intro": [],
    "subs": [
      {
        "no": "6.1",
        "title": "How Payment Works",
        "blocks": [
          {
            "kind": "p",
            "text": "When you pay for an Order, your payment is collected through FamGateway, our payment gateway. Loopy receives that payment and pays out the Seller's share, after the Settlement Delay described below, to the Seller's UPI ID or bank account, less our platform fee and any deductions described in this Article. Loopy does not operate a wallet or a deposit account for Users, and does not invest or use Order funds for any purpose other than completing the Order they relate to."
          }
        ]
      },
      {
        "no": "6.2",
        "title": "What You Pay",
        "blocks": [
          {
            "kind": "p",
            "text": "At checkout you will see, separately and before you confirm payment: the Listing price, any shipping charge set by the Seller, applicable taxes, and Loopy's platform fee of 5% of the Order value. The platform fee pays for the Platform and our support services. Payment is processed through FamGateway; we do not receive or store your full card details. If we change the platform fee, we will give notice as described in Article 3."
          },
          {
            "kind": "p",
            "text": "The platform fee is not refundable once an Order is placed, even if the Order is later cancelled or a return is agreed with the Seller. The only exception is where Applicable Law requires the entire amount you paid, including the platform fee, to be refunded — see the exceptions in Article 9."
          }
        ]
      },
      {
        "no": "6.3",
        "title": "The Settlement Delay",
        "blocks": [
          {
            "kind": "p",
            "text": "An Order's proceeds do not reach the Seller immediately. For approximately 24 hours from the time the Order is placed, the Order remains in a settlement delay, during which it can still be cancelled, refunded or disputed without needing to recover money from the Seller. After that period, if there is no open cancellation, refund request, dispute, chargeback or fraud review, we pay out the proceeds to the Seller."
          },
          {
            "kind": "p",
            "text": "The delay gives us time to catch a cancellation, an obvious problem, or a dispute before money moves to the Seller. It is not a guarantee of payment to a Seller, and not a guarantee of a refund to a Buyer."
          },
          {
            "kind": "p",
            "text": "We may extend this delay, or withhold a Settlement in whole or in part, where an Order is subject to an open dispute, a chargeback, suspected fraud, or a legal or regulatory requirement. We will tell the Seller the reason where we practically can."
          }
        ]
      },
      {
        "no": "6.4",
        "title": "Settlement to Sellers",
        "blocks": [
          {
            "kind": "p",
            "text": "Settlement is paid to the UPI ID or bank account you gave us. You are responsible for keeping those details accurate; we cannot recover a payment sent to the wrong account because the details you gave us were wrong or out of date. Settlement amounts are net of our platform fee, any payment-gateway or bank charges, and any tax we are required to collect at source. Those deductions are shown in your Settlement statement."
          }
        ]
      },
      {
        "no": "6.5",
        "title": "When Something Goes Wrong With a Payment",
        "blocks": [
          {
            "kind": "p",
            "text": "Situation"
          },
          {
            "kind": "p",
            "text": "What Happens"
          },
          {
            "kind": "p",
            "text": "Payment fails at checkout"
          },
          {
            "kind": "p",
            "text": "No Order is created. Any amount debited is reversed through FamGateway, usually within 7–14 business days."
          },
          {
            "kind": "p",
            "text": "Buyer cancels before dispatch"
          },
          {
            "kind": "p",
            "text": "See Article 8. The product price and shipping charge are returned as the Seller decides; the platform fee is not refundable."
          },
          {
            "kind": "p",
            "text": "Seller cannot fulfil"
          },
          {
            "kind": "p",
            "text": "The Order is cancelled; the product price and shipping charge are returned to the Buyer. The platform fee is not refundable."
          },
          {
            "kind": "p",
            "text": "Refund approved"
          },
          {
            "kind": "p",
            "text": "Processed to the original payment method through FamGateway — see Article 9."
          },
          {
            "kind": "p",
            "text": "Chargeback raised with the Buyer's bank"
          },
          {
            "kind": "p",
            "text": "The bank's process governs the outcome. We may withhold the related Settlement while it runs, and will share Order and tracking records with the parties involved."
          },
          {
            "kind": "p",
            "text": "Suspected fraud"
          },
          {
            "kind": "p",
            "text": "We may pause Settlement and review the Order, as described in Article 11."
          }
        ]
      }
    ]
  },
  {
    "n": 7,
    "id": "shipping-and-delivery",
    "title": "Shipping and Delivery",
    "intro": [],
    "subs": [
      {
        "no": "7.1",
        "title": "Who Ships Your Order",
        "blocks": [
          {
            "kind": "p",
            "text": "The Seller who accepts your Order ships it. Loopy does not run a courier service, does not arrange pickup and does not take custody of any product. Sellers choose their own courier and must disclose delivery timelines and charges accurately on the Listing or at checkout."
          }
        ]
      },
      {
        "no": "7.2",
        "title": "Tracking and Timelines",
        "blocks": [
          {
            "kind": "p",
            "text": "Every Order gets tracking information, which the Seller updates on the Platform after dispatch. We do not promise a delivery date and cannot guarantee delivery: the timeline shown to you is the Seller's, not ours."
          }
        ]
      },
      {
        "no": "7.3",
        "title": "Late, Lost or Damaged Deliveries",
        "blocks": [
          {
            "kind": "p",
            "text": "If your Order is late, lost or arrives damaged, tell us and we will help you reach the Seller. Whether the product price is refunded is the Seller's decision, except that non-delivery, a materially late delivery, and a damaged or defective product are among the cases in Article 9 where a refund is not left to the Seller's discretion. The platform fee is not refundable in any case — see Article 6. Nothing here limits your rights as a consumer under Applicable Law against the Seller or, where the law makes us responsible, against us."
          }
        ]
      }
    ]
  },
  {
    "n": 8,
    "id": "cancellations",
    "title": "Cancellations",
    "intro": [],
    "subs": [
      {
        "no": "8.1",
        "title": "Cancellation Policy",
        "blocks": [
          {
            "kind": "p",
            "text": "Whether an Order can be cancelled, and what you get back if it is, is set by the Seller's own cancellation policy shown on the Listing. To cancel, contact the Seller directly using the contact details on their storefront. Loopy will help you reach the Seller if you need it, but the decision on a cancellation request belongs to the Seller, not to us."
          }
        ]
      },
      {
        "no": "8.2",
        "title": "What Is Refunded",
        "blocks": [
          {
            "kind": "p",
            "text": "Where a Seller agrees to a cancellation, the product price and any shipping charge are refunded as the Seller decides. The platform fee is not refundable, whether or not the Order is cancelled — see Article 6."
          }
        ]
      },
      {
        "no": "8.3",
        "title": "Cancellation by a Seller",
        "blocks": [
          {
            "kind": "p",
            "text": "A Seller may also cancel an Order before dispatch — for example, where a product is out of stock — in which case the product price and shipping charge are returned to you; the platform fee is still not refundable."
          }
        ]
      },
      {
        "no": "8.4",
        "title": "After Dispatch",
        "blocks": [
          {
            "kind": "p",
            "text": "Once an Order has been dispatched, Article 9 (returns and refunds) applies instead of cancellation."
          }
        ]
      }
    ]
  },
  {
    "n": 9,
    "id": "returns-and-refunds",
    "title": "Returns and Refunds",
    "intro": [],
    "subs": [
      {
        "no": "9.1",
        "title": "Raising a Request",
        "blocks": [
          {
            "kind": "p",
            "text": "Raise a return or refund request from the Order page, with the reason and photographs where relevant, within [N] days of delivery or of the expected delivery date. The request goes to the Seller and to our support team at the same time."
          }
        ]
      },
      {
        "no": "9.2",
        "title": "The Seller's Decision Is Final",
        "blocks": [
          {
            "kind": "p",
            "text": "The Seller knows their own product and their own return policy, so the Seller decides whether to accept, partially accept or decline a return or refund request, in line with the return policy shown on that Listing. Once the Seller has made that decision, it is final, and Loopy does not reopen or overrule it as a matter of course."
          }
        ]
      },
      {
        "no": "9.3",
        "title": "The Exceptions the Law Requires",
        "blocks": [
          {
            "kind": "p",
            "text": "There is a narrow set of situations where a Seller cannot refuse to take back a product or refuse to refund you, whatever their own return policy says, because Indian consumer law does not allow it to be a matter of discretion. These are where the product:"
          },
          {
            "kind": "li",
            "text": "was never delivered, or was delivered late against the timeline shown at checkout;"
          },
          {
            "kind": "li",
            "text": "is defective, damaged, deficient or spurious;"
          },
          {
            "kind": "li",
            "text": "is not the product you ordered, or does not match the Listing in a material way;"
          },
          {
            "kind": "li",
            "text": "is counterfeit, or cannot lawfully be sold."
          },
          {
            "kind": "p",
            "text": "In these specific cases we will act on the refund whether or not the Seller agrees, because it is a legal entitlement rather than a business decision. Outside them, the outcome is the Seller's call. In practice, most Sellers refund the Buyer directly themselves — using their own payment method or account — as soon as the request is confirmed, and no action from Loopy is needed. If a Seller does not do this, Loopy will step in and instruct the payment gateway to withhold or reverse the related Settlement, as described below."
          }
        ]
      },
      {
        "no": "9.4",
        "title": "How It Is Processed",
        "blocks": [
          {
            "kind": "p",
            "text": "We aim to pass on the Seller's decision within 7–14 business days of your request. Approved refunds are returned to your original payment method through FamGateway, and we will initiate them within 7–14 business days of approval; how long the money then takes to reach you depends on your bank. If a return shipment is needed, the Listing or our support team will tell you where to send it and who pays for it. If the Seller does not respond in time, the matter is escalated under Article 11, and — for the exceptions above only — we may instruct the payment gateway to withhold or reverse the related Settlement."
          }
        ]
      },
      {
        "no": "9.5",
        "title": "Orders You Did Not Authorise",
        "blocks": [
          {
            "kind": "p",
            "text": "If you believe an Order was placed on your account or payment method without your authorisation — including by a minor in your household — tell us as soon as you can. We will raise it with the Seller under Article 11 and ask whether they are willing to accept a return and issue a refund. If the Seller agrees, we will process it, subject to Article 6 on the platform fee. If the Seller does not agree, we are not able to refund the product price ourselves, because we have no way to independently verify what happened on your device or account."
          },
          {
            "kind": "p",
            "text": "This is separate from any right you have against your bank or card network: if a transaction was genuinely unauthorised, you may still be able to have it reversed directly with them, independently of anything in this document."
          }
        ]
      }
    ]
  },
  {
    "n": 10,
    "id": "who-is-responsible-for-what",
    "title": "Who Is Responsible for What",
    "intro": [
      {
        "kind": "p",
        "text": "This table is a summary. The detailed terms above prevail if they differ."
      },
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
        "text": "Product description, price, stock, quality, authenticity, safety, legality, licences"
      },
      {
        "kind": "p",
        "text": "Seller"
      },
      {
        "kind": "p",
        "text": "Packing, dispatch, courier choice, delivery, tracking updates"
      },
      {
        "kind": "p",
        "text": "Seller"
      },
      {
        "kind": "p",
        "text": "Seller's own return policy, warranty and after-sales service"
      },
      {
        "kind": "p",
        "text": "Seller"
      },
      {
        "kind": "p",
        "text": "Seller's taxes and registrations"
      },
      {
        "kind": "p",
        "text": "Seller"
      },
      {
        "kind": "p",
        "text": "Accurate delivery and contact details, payment authorisation, lawful use"
      },
      {
        "kind": "p",
        "text": "Buyer"
      },
      {
        "kind": "p",
        "text": "Checking the product on arrival and raising problems in time"
      },
      {
        "kind": "p",
        "text": "Buyer"
      },
      {
        "kind": "p",
        "text": "Operating the Platform, Order creation, and assisting both Buyers and Sellers"
      },
      {
        "kind": "p",
        "text": "Loopy"
      },
      {
        "kind": "p",
        "text": "Disclosing fees and Seller details, handling complaints, the settlement delay"
      },
      {
        "kind": "p",
        "text": "Loopy"
      },
      {
        "kind": "p",
        "text": "Return and refund decisions, outside the exceptions in Article 9"
      },
      {
        "kind": "p",
        "text": "Seller (final)"
      },
      {
        "kind": "p",
        "text": "Cancellation policy and cancellation decisions"
      },
      {
        "kind": "p",
        "text": "Seller (final) — Loopy assists contact only"
      },
      {
        "kind": "p",
        "text": "Enforcing the legally mandatory refund exceptions in Article 9"
      },
      {
        "kind": "p",
        "text": "Loopy"
      },
      {
        "kind": "p",
        "text": "Platform fee refunds"
      },
      {
        "kind": "p",
        "text": "Never, except where Article 9's mandatory exceptions require the full amount refunded"
      },
      {
        "kind": "p",
        "text": "Handling personal data as described in Article 12"
      },
      {
        "kind": "p",
        "text": "Loopy, with its providers"
      },
      {
        "kind": "p",
        "text": "Collecting Buyer payments and paying out Sellers; card and UPI data security"
      },
      {
        "kind": "p",
        "text": "Loopy, via a licensed payment gateway"
      },
      {
        "kind": "p",
        "text": "Physical transit of the parcel"
      },
      {
        "kind": "p",
        "text": "Courier engaged by the Seller"
      }
    ],
    "subs": []
  },
  {
    "n": 11,
    "id": "complaints-and-disputes",
    "title": "Complaints and Disputes",
    "intro": [],
    "subs": [
      {
        "no": "11.1",
        "title": "Grievance Officer",
        "blocks": [
          {
            "kind": "p",
            "text": "If something has gone wrong, write to our grievance officer:"
          },
          {
            "kind": "p",
            "text": "Name: Ankit Sah (Team Loopy)"
          },
          {
            "kind": "p",
            "text": "Designation: Co-Founder, Loopy"
          },
          {
            "kind": "p",
            "text": "Email: loopynowshopsupport@gmail.com"
          },
          {
            "kind": "p",
            "text": "Address: Mumbai, Maharashtra given"
          },
          {
            "kind": "p",
            "text": "We will acknowledge your complaint within 48 hours of receiving it and aim to resolve it within one month, in line with Applicable Law. Give us the Order number and a short description of the problem."
          }
        ]
      },
      {
        "no": "11.2",
        "title": "Disputes Between a Buyer and a Seller",
        "blocks": [
          {
            "kind": "p",
            "text": "Most problems are between a Buyer and the Seller, and the underlying contract is theirs. Our role is to help it get resolved: we relay communication, look at the Order record, tracking and messages, and tell both sides what we think the right outcome is. Where Article 9 applies, we will enforce a refund. Where it does not, our view is a recommendation, not a binding ruling, and neither party gives up any right to take the matter further."
          },
          {
            "kind": "p",
            "text": "Where we control the timing of Settlement, we may delay or withhold it while a dispute is open, and may instruct a reversal where a refund is due under Article 9. Beyond that, we do not compensate either party out of our own funds for a loss caused by the other, and we do not operate a compensation or buyer-protection fund. We say this as a factual description of what we do, not as an attempt to exclude any responsibility the law places on us."
          }
        ]
      },
      {
        "no": "11.3",
        "title": "Fraud and Abuse",
        "blocks": [
          {
            "kind": "p",
            "text": "If you report suspected fraud, we will review the available evidence and may pause Settlement while we do. Where we find a User has acted fraudulently — non-delivery, counterfeit or misrepresented goods, false refund claims, payment abuse — we may warn them, remove Listings, restrict or suspend the account, withhold related Settlement, or terminate the account, and we may report the matter to the police or another authority."
          }
        ]
      },
      {
        "no": "11.4",
        "title": "Disputes with Loopy",
        "blocks": [
          {
            "kind": "p",
            "text": "A complaint about our own services — the Platform, our fees, our support, our handling of your data — goes to the grievance officer above. If we cannot resolve it, you keep every remedy available to you under Applicable Law, including approaching a consumer forum."
          }
        ]
      }
    ]
  },
  {
    "n": 12,
    "id": "privacy",
    "title": "Privacy",
    "intro": [
      {
        "kind": "p",
        "text": "This Article explains what personal data we collect, why, who we share it with and what you can ask us to do about it. It applies to Buyers and Sellers."
      }
    ],
    "subs": [
      {
        "no": "12.1",
        "title": "What We Collect",
        "blocks": [
          {
            "kind": "p",
            "text": "From Buyers: name, phone number, delivery address, email address, Order and tracking history, messages you send us, and payment confirmation data from the Payment Provider. We do not receive or store your full card number, CVV or UPI PIN."
          },
          {
            "kind": "p",
            "text": "From Sellers: name or business name, business address, email address, phone number, PAN and GSTIN where applicable, settlement details (UPI ID or bank account number, IFSC and account holder name), Listing content and Order records."
          },
          {
            "kind": "p",
            "text": "From everyone, automatically: IP address, device and browser type, pages visited and similar usage data, through cookies and our hosting and analytics providers. If you sign in through Google, we receive the name, email address and profile information you authorise it to share."
          }
        ]
      },
      {
        "no": "12.2",
        "title": "Why We Use It",
        "blocks": [
          {
            "kind": "li",
            "text": "to create and verify accounts, and to display the Seller information the law requires;"
          },
          {
            "kind": "li",
            "text": "to process Orders, payments, Settlements and refunds;"
          },
          {
            "kind": "li",
            "text": "to let Buyers and Sellers arrange delivery and communicate about an Order;"
          },
          {
            "kind": "li",
            "text": "to send Order updates, tracking and support replies;"
          },
          {
            "kind": "li",
            "text": "to look into complaints, disputes, fraud and breaches of these terms;"
          },
          {
            "kind": "li",
            "text": "to keep the Platform working, secure and improving;"
          },
          {
            "kind": "li",
            "text": "to meet our own legal, tax and accounting obligations."
          },
          {
            "kind": "p",
            "text": "We do not sell your personal data. We do not use it for advertising profiling."
          }
        ]
      },
      {
        "no": "12.3",
        "title": "Who We Share It With",
        "blocks": [
          {
            "kind": "li",
            "text": "the Seller fulfilling your Order — your name, phone number and delivery address, so it can be delivered;"
          },
          {
            "kind": "li",
            "text": "the courier the Seller engages, for the same purpose;"
          },
          {
            "kind": "li",
            "text": "FamGateway, our payment gateway, to process payments, refunds and Settlements;"
          },
          {
            "kind": "li",
            "text": "an authority, court or regulator, where the law requires it."
          },
          {
            "kind": "p",
            "text": "These providers may process your data only to do the job we engage them for. We remain answerable for how we handle your data, including where a provider handles it for us."
          }
        ]
      },
      {
        "no": "12.4",
        "title": "How Long We Keep It",
        "blocks": [
          {
            "kind": "p",
            "text": "Account and Order records are kept for as long as your account is open and for [N] years afterwards, so that we can meet tax, accounting and legal obligations and deal with any later dispute. Support messages are kept for [N] years. Where we no longer need something, we delete or anonymise it."
          }
        ]
      },
      {
        "no": "12.5",
        "title": "Your Rights",
        "blocks": [
          {
            "kind": "p",
            "text": "You can ask us to give you a copy of the personal data we hold about you, correct it or complete it, delete it, or stop a particular use of it, and you can withdraw consent to anything you have consented to. Write to loopynowshopsupport@gmail.com and we will respond within 7–14 business days. Some records we must keep even after you close your account, and we will tell you if that applies. If you are not happy with our response, you can escalate under Article 11 or to the authority with jurisdiction under the Digital Personal Data Protection Act, 2023."
          }
        ]
      },
      {
        "no": "12.6",
        "title": "Security, and Children",
        "blocks": [
          {
            "kind": "p",
            "text": "We use reasonable technical and organisational measures to protect personal data, including restricted internal access and encryption in transit, and we apply tighter controls to Seller PAN and settlement details. No system is completely secure, so please protect your own login. If a breach affects your data, we will notify you and the authority as the law requires."
          },
          {
            "kind": "p",
            "text": "The Platform is not for use by anyone under 18. We do not knowingly collect data from children or track them, and if we learn we have, we will delete it. See Article 3."
          }
        ]
      }
    ]
  },
  {
    "n": 13,
    "id": "cookies",
    "title": "Cookies",
    "intro": [
      {
        "kind": "p",
        "text": "We use a small number of cookies and similar technologies:"
      },
      {
        "kind": "li",
        "text": "Essential — to sign you in, keep your session, remember your cart and run checkout. The Platform will not work without these."
      },
      {
        "kind": "li",
        "text": "Analytics — to understand how the Platform is used so we can improve it."
      },
      {
        "kind": "p",
        "text": "Your browser settings let you block or delete cookies. Blocking essential cookies will break sign-in and checkout."
      }
    ],
    "subs": []
  },
  {
    "n": 14,
    "id": "prohibited-products",
    "title": "Prohibited Products",
    "intro": [
      {
        "kind": "p",
        "text": "Sellers must not list anything that is illegal, counterfeit, unsafe or restricted, including:"
      },
      {
        "kind": "li",
        "text": "narcotics, controlled substances and drug paraphernalia;"
      },
      {
        "kind": "li",
        "text": "firearms, ammunition, explosives and regulated weapons;"
      },
      {
        "kind": "li",
        "text": "counterfeit goods, unauthorised replicas, and anything that infringes someone else's intellectual property;"
      },
      {
        "kind": "li",
        "text": "prescription medicines, medical devices and anything else needing a licence the Seller does not hold;"
      },
      {
        "kind": "li",
        "text": "hazardous or banned chemicals and substances;"
      },
      {
        "kind": "li",
        "text": "tobacco, alcohol and other age-restricted goods, unless we have expressly allowed the category and the Seller holds the required licence;"
      },
      {
        "kind": "li",
        "text": "live animals, human remains or tissue;"
      },
      {
        "kind": "li",
        "text": "stolen goods, and anything else whose sale is prohibited or restricted in India."
      },
      {
        "kind": "p",
        "text": "We may remove a Listing that appears to breach this Article without prior notice, and may suspend or terminate a Seller's account for repeated or serious breaches. We keep a record of Listings removed for counterfeiting or intellectual property infringement."
      }
    ],
    "subs": []
  },
  {
    "n": 15,
    "id": "conduct-and-reviews",
    "title": "Conduct and Reviews",
    "intro": [],
    "subs": [
      {
        "no": "15.1",
        "title": "General Conduct",
        "blocks": [
          {
            "kind": "p",
            "text": "Be civil. Harassment, threats, discriminatory abuse or intimidation of another User or of our team is not tolerated and may cost you your account."
          }
        ]
      },
      {
        "no": "15.2",
        "title": "Reviews and Ratings",
        "blocks": [
          {
            "kind": "p",
            "text": "Reviews and ratings must come from a real experience of the product or Seller. Fake reviews, reviews written by a Seller about its own products or a competitor's, undisclosed paid reviews and any other manipulation are prohibited. We may remove a review that breaches this Article and act against the account behind it."
          }
        ]
      },
      {
        "no": "15.3",
        "title": "Platform Integrity",
        "blocks": [
          {
            "kind": "p",
            "text": "Do not interfere with the Platform: no scraping beyond what our terms allow, no attempts to break security, no automated Order creation, no reverse engineering."
          },
          {
            "kind": "p",
            "text": "Report a breach to loopynowshopsupport@gmail.com."
          }
        ]
      }
    ]
  },
  {
    "n": 16,
    "id": "liability",
    "title": "Liability",
    "intro": [],
    "subs": [
      {
        "no": "16.1",
        "title": "Platform Provided As Is",
        "blocks": [
          {
            "kind": "p",
            "text": "The Platform is provided as it is and as available. We work to keep it running and secure, but we do not promise that it will be uninterrupted or free of errors, and we do not warrant the accuracy of a Listing, the quality, safety or authenticity of a product, or the conduct of any Buyer or Seller."
          }
        ]
      },
      {
        "no": "16.2",
        "title": "Scope of Our Responsibility",
        "blocks": [
          {
            "kind": "p",
            "text": "We are responsible for our own services and our own acts and omissions, including how we operate the Platform and handle your data. We are not responsible for the products themselves, for a Seller's or Buyer's performance, or for loss arising in transit, except where Applicable Law makes us responsible."
          }
        ]
      },
      {
        "no": "16.3",
        "title": "Limitation of Liability",
        "blocks": [
          {
            "kind": "p",
            "text": "To the extent the law allows, we are not liable for indirect or consequential loss — lost profit, lost business, lost data or reputational harm — arising from your use of the Platform, and our total liability for any claim relating to an Order is limited to the amount you paid for that Order together with the platform fee on it."
          },
          {
            "kind": "p",
            "text": "Nothing in this document excludes or limits any liability that cannot lawfully be excluded, including under the Consumer Protection Act, 2019, and nothing in it removes a consumer's statutory rights."
          }
        ]
      },
      {
        "no": "16.4",
        "title": "Events Outside Our Control",
        "blocks": [
          {
            "kind": "p",
            "text": "Neither we nor a Seller is in breach for a delay or failure caused by something genuinely outside reasonable control — natural disaster, fire, flood, epidemic, strike, riot, war, failure of a public network or utility, courier shutdown, or action by a government or regulator. Where that happens you are still entitled to a refund for an Order that cannot be delivered."
          }
        ]
      },
      {
        "no": "16.5",
        "title": "Indemnity",
        "blocks": [
          {
            "kind": "p",
            "text": "If a claim is brought against us because of what you listed, sold, said or did on the Platform — an unsafe or infringing product, a misleading Listing, a breach of these terms or of the law — you agree to cover the loss and reasonable legal costs we incur as a result. This does not cover loss caused by our own breach or negligence."
          }
        ]
      }
    ]
  },
  {
    "n": 17,
    "id": "governing-law",
    "title": "Governing Law",
    "intro": [
      {
        "kind": "p",
        "text": "This document and your use of the Platform are governed by the laws of India. Subject to Article 11, the courts at Mumbai, Maharashtra have jurisdiction over any dispute arising from it."
      },
      {
        "kind": "p",
        "text": "This does not affect any right you have as a consumer to approach a consumer commission or other statutory forum where you live or where the cause of action arose."
      }
    ],
    "subs": []
  },
  {
    "n": 18,
    "id": "contact",
    "title": "Contact",
    "intro": [
      {
        "kind": "p",
        "text": "Support: loopynowshopsupport@gmail.com response time — 7–14 business days used elsewhere; confirm if support replies should be faster"
      },
      {
        "kind": "p",
        "text": "Grievances: loopynowshopsupport@gmail.com, attention Ankit Sah, Co-Founder"
      },
      {
        "kind": "p",
        "text": "Privacy requests: loopynowshopsupport@gmail.com"
      },
      {
        "kind": "p",
        "text": "Correspondence address Mumbai, Maharashtra given; street address and PIN code"
      },
      {
        "kind": "p",
        "text": "Payment queries: handled with our payment gateway, FamGateway; its own information is at [famgateway.in — confirm the exact policy/terms page]"
      },
      {
        "kind": "p",
        "text": "Loopy operated by Zohan Alam, Mumbai, India. Not yet incorporated; see Article 1."
      }
    ],
    "subs": []
  }
];

/** One Article by its id, for a page that renders a single policy. */
export function legalSection(id: string): LegalSection | undefined {
  return LEGAL_SECTIONS.find((s) => s.id === id);
}

/** Several Articles in the order given — how each policy page is composed. */
export function legalSections(...ids: string[]): LegalSection[] {
  return ids.map((id) => legalSection(id)).filter(Boolean) as LegalSection[];
}
