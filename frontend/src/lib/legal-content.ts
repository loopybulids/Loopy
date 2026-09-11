/**
 * Loopy's legal policies, as a single source of truth.
 *
 * Generated from LoopyNow_Legal_Policies.docx — the reviewed policy document —
 * so the site cannot drift from the signed-off wording. Every legal page on the
 * site renders from this file; to change a policy, change it here (or
 * regenerate from an updated document) rather than editing a page.
 *
 * 15 sections, 63 subsections.
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

/** Document-level facts shown in the header of every policy page. */
export const LEGAL_META = {
  site: "https://www.loopynow.shop",
  contact: "support.loopynow.shop@gmail.com",
  /** Empty until the policy is formally adopted — the pages say so when it is. */
  effectiveDate: "",
  /** Kept verbatim: this is a pre-review draft and the site should not pretend otherwise. */
  draftNote: "This document is a draft prepared for LoopyNow's MVP stage. It should be reviewed by a qualified lawyer licensed in India before publication, and updated with the registered legal entity name, address, and Grievance Officer details once the business is formally registered.",
};

export const LEGAL_SECTIONS: LegalSection[] = [
  {
    "n": 1,
    "id": "definitions-and-interpretation",
    "title": "Definitions and Interpretation",
    "intro": [
      {
        "kind": "p",
        "text": "The definitions below apply across every policy in this document unless a specific policy states otherwise. Defined terms are capitalised throughout."
      }
    ],
    "subs": [
      {
        "no": "1.1",
        "title": "Key Terms",
        "blocks": [
          {
            "kind": "li",
            "text": "\"Platform\" or \"LoopyNow\" means the website located at https://www.loopynow.shop, together with any associated mobile applications, APIs, and services operated in connection with it."
          },
          {
            "kind": "li",
            "text": "\"Operator\", \"we\", \"us\", or \"our\" means the operator of the Platform, currently trading as LoopyNow, and to be formally identified as [Legal Entity Name, to be inserted upon business registration] upon registration."
          },
          {
            "kind": "li",
            "text": "\"User\" means any person who accesses or uses the Platform, including both Buyers and Sellers."
          },
          {
            "kind": "li",
            "text": "\"Buyer\" means a User who browses, orders, or purchases products listed on the Platform."
          },
          {
            "kind": "li",
            "text": "\"Seller\" means a User who registers on the Platform to list, advertise, and sell products to Buyers."
          },
          {
            "kind": "li",
            "text": "\"Listing\" means any product, description, price, image, or offer that a Seller publishes on the Platform."
          },
          {
            "kind": "li",
            "text": "\"Order\" means a confirmed request by a Buyer to purchase one or more Listings from a Seller through the Platform."
          },
          {
            "kind": "li",
            "text": "\"Payout\" means the transfer of funds collected from a Buyer, net of applicable fees, to a Seller's designated UPI ID or bank account."
          },
          {
            "kind": "li",
            "text": "\"Payout Hold Period\" means the 48-hour period, calculated from the date and time an Order is placed, during which funds relating to that Order are held by the Platform before becoming eligible for release or refund processing."
          },
          {
            "kind": "li",
            "text": "\"Account\" means the registered profile a User creates on the Platform, whether as a Buyer or a Seller, including any linked Google account used for sign-in."
          },
          {
            "kind": "li",
            "text": "\"Content\" means text, images, product descriptions, reviews, ratings, and any other material submitted to or displayed on the Platform."
          },
          {
            "kind": "li",
            "text": "\"Applicable Law\" means the laws of the Republic of India, including but not limited to the Consumer Protection Act, 2019, the Consumer Protection (E-Commerce) Rules, 2020, the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023, as amended from time to time."
          }
        ]
      },
      {
        "no": "1.2",
        "title": "Role of the Platform",
        "blocks": [
          {
            "kind": "p",
            "text": "LoopyNow operates as an online marketplace and intermediary within the meaning of the Information Technology Act, 2000 and the Consumer Protection (E-Commerce) Rules, 2020. LoopyNow connects Buyers with independent Sellers and facilitates the discovery, ordering, and payment process for transactions between them. LoopyNow is not the manufacturer, importer, or seller of the products listed on the Platform, and does not take ownership or possession of any product at any stage of the transaction unless expressly stated otherwise for a specific Listing."
          },
          {
            "kind": "p",
            "text": "Because LoopyNow acts as an intermediary, primary responsibility for product quality, accuracy of Listings, packaging, shipping, and fulfilment of an Order rests with the Seller who created that Listing. Where Applicable Law imposes obligations directly on marketplaces, LoopyNow will comply with those obligations; nothing in this document is intended to exclude liability that cannot lawfully be excluded."
          }
        ]
      }
    ]
  },
  {
    "n": 2,
    "id": "terms-of-service",
    "title": "Terms of Service",
    "intro": [
      {
        "kind": "p",
        "text": "These Terms of Service (\"Terms\") govern access to and use of the Platform by all Users. By creating an Account, browsing the Platform, or placing or fulfilling an Order, you agree to be bound by these Terms, together with the Privacy Policy, Seller Agreement, Buyer Terms, and all other policies referenced in this document. If you do not agree, you must not use the Platform."
      }
    ],
    "subs": [
      {
        "no": "2.1",
        "title": "Eligibility",
        "blocks": [
          {
            "kind": "p",
            "text": "The Platform is open to Users of all ages for browsing and other non-transactional features. However, placing an Order, completing checkout, or making a payment requires that the payment be made by, or with the explicit involvement and authorisation of, a person who is at least 18 years of age and capable of entering into a legally binding contract under the Indian Contract Act, 1872 (\"Adult\")."
          },
          {
            "kind": "p",
            "text": "Where a User is under 18, that User may browse the Platform, but an Adult must complete the Account registration (where required for checkout), authorise the payment, and, where applicable, provide consent to the collection and processing of the minor's personal information as described in the Privacy Policy. LoopyNow may request verification of age, or of an Adult's involvement in a specific transaction, at its discretion, and may decline to process an Order where this cannot be confirmed."
          }
        ]
      },
      {
        "no": "2.2",
        "title": "Account Registration and Google Sign-In",
        "blocks": [
          {
            "kind": "p",
            "text": "Accounts are created using Google Sign-In. By registering, you authorise LoopyNow to receive your name, email address, and profile information from your Google account for the purpose of creating and verifying your Account. You are responsible for maintaining the confidentiality and security of your Google credentials and for all activity that occurs under your Account."
          },
          {
            "kind": "p",
            "text": "Google's own account-eligibility rules govern who may independently create a Google Account. Where a User is below the minimum age required to hold a Google Account in their region, or is otherwise under 18, an Adult must complete Account registration and checkout on that User's behalf, as described in Section 2.1."
          },
          {
            "kind": "p",
            "text": "You agree to provide accurate, current, and complete information during registration and to promptly update that information if it changes. LoopyNow reserves the right to suspend or terminate an Account that contains false, misleading, or unverifiable information."
          }
        ]
      },
      {
        "no": "2.3",
        "title": "Nature of the Platform",
        "blocks": [
          {
            "kind": "p",
            "text": "LoopyNow is a marketplace intermediary as described in Section 1.2. Contracts of sale formed through the Platform are formed directly between the Buyer and the Seller. LoopyNow facilitates discovery, checkout, payment collection, and dispute assistance, but is not a party to the underlying contract of sale unless a specific Listing states that LoopyNow itself is the seller."
          }
        ]
      },
      {
        "no": "2.4",
        "title": "Fees",
        "blocks": [
          {
            "kind": "p",
            "text": "LoopyNow charges Buyers a platform fee of 5% of the Order value. This fee is calculated and displayed at checkout, in addition to the Listing price and any shipping charges, before the Buyer confirms payment. The platform fee is retained by LoopyNow in consideration of the Platform's facilitation, payment-processing, and support services, and does not reduce the amount payable to the Seller for the Order."
          },
          {
            "kind": "p",
            "text": "LoopyNow does not currently charge Sellers a separate commission or listing fee, but reserves the right to introduce Seller-side fees in the future, in which case reasonable advance notice will be given as described below. LoopyNow will provide reasonable advance notice of any change to its fee structure, including any change to the 5% platform fee charged to Buyers."
          }
        ]
      },
      {
        "no": "2.5",
        "title": "Account Suspension and Termination",
        "blocks": [
          {
            "kind": "p",
            "text": "LoopyNow may suspend, restrict, or terminate a User's Account, with or without notice, where the User breaches these Terms, engages in fraudulent or abusive conduct, repeatedly fails to fulfil Orders, receives a disproportionate volume of verified complaints, or where required to do so by Applicable Law or a competent authority. Where practicable, LoopyNow will give the User an opportunity to explain their conduct before taking action, except where immediate suspension is necessary to prevent harm to other Users or to the Platform."
          },
          {
            "kind": "p",
            "text": "A User may close their Account at any time by contacting support.loopynow.shop@gmail.com, subject to the settlement of any pending Orders, Payouts, or disputes."
          }
        ]
      },
      {
        "no": "2.6",
        "title": "Intellectual Property",
        "blocks": [
          {
            "kind": "p",
            "text": "The LoopyNow name, logo, website design, and underlying software are the property of the Operator and may not be copied, reproduced, or used without prior written permission. Sellers retain ownership of the Content they upload but grant LoopyNow a non-exclusive, royalty-free licence to host, display, reproduce, and distribute that Content on the Platform and in connection with promoting the Platform, for as long as the relevant Listing remains active and for a reasonable period thereafter for record-keeping purposes."
          }
        ]
      },
      {
        "no": "2.7",
        "title": "Modification of Terms",
        "blocks": [
          {
            "kind": "p",
            "text": "LoopyNow may update these Terms from time to time to reflect changes in its services, business practices, or Applicable Law. Material changes will be notified to Users through the Platform or by email at least seven days before they take effect. Continued use of the Platform after a change takes effect constitutes acceptance of the revised Terms."
          }
        ]
      },
      {
        "no": "2.8",
        "title": "Governing Law and Jurisdiction",
        "blocks": [
          {
            "kind": "p",
            "text": "These Terms are governed by the laws of India. Subject to the Grievance Redressal Policy in Section 11, the courts at the location of the Operator's registered office shall have exclusive jurisdiction over any dispute arising out of or relating to these Terms, without prejudice to any statutory forum a consumer is entitled to approach under Applicable Law."
          }
        ]
      }
    ]
  },
  {
    "n": 3,
    "id": "seller-agreement",
    "title": "Seller Agreement",
    "intro": [
      {
        "kind": "p",
        "text": "This Seller Agreement applies to every User who registers as a Seller on the Platform and sets out the specific obligations that apply to Sellers, in addition to the general Terms of Service."
      }
    ],
    "subs": [
      {
        "no": "3.1",
        "title": "Seller Verification",
        "blocks": [
          {
            "kind": "p",
            "text": "To register as a Seller, you must provide and keep current the following information:"
          },
          {
            "kind": "li",
            "text": "A valid email address and phone number;"
          },
          {
            "kind": "li",
            "text": "Your full name or registered business name;"
          },
          {
            "kind": "li",
            "text": "Your business or operating address;"
          },
          {
            "kind": "li",
            "text": "Your payout details, being either a UPI ID or a bank account number together with the IFSC code and the account holder's name."
          },
          {
            "kind": "p",
            "text": "LoopyNow may verify this information before activating a Seller's ability to publish Listings or receive Payouts, and may periodically re-verify it. Providing false or mismatched verification details is a material breach of this Agreement and may result in suspension of the Seller Account and withholding of pending Payouts pending resolution."
          }
        ]
      },
      {
        "no": "3.2",
        "title": "Listings",
        "blocks": [
          {
            "kind": "p",
            "text": "Sellers are solely responsible for the accuracy, legality, and completeness of every Listing they publish, including product descriptions, images, pricing, stock availability, and applicable warranties. Listings must not be misleading and must comply with the Prohibited Products Policy in Section 13. LoopyNow may remove or edit a Listing that appears to breach this Agreement or Applicable Law, and will notify the Seller where reasonably practicable."
          }
        ]
      },
      {
        "no": "3.3",
        "title": "Order Fulfilment and Shipping Responsibility",
        "blocks": [
          {
            "kind": "p",
            "text": "Sellers are responsible for packaging, dispatching, and shipping Orders to Buyers, as set out in the Shipping Policy in Section 7. LoopyNow does not arrange courier pickup, does not take custody of products, and is not responsible for delays, damage, or loss occurring during shipping. Each Order is assigned a tracking ID, which the Seller must update within the Platform once the Order is dispatched so that both the Buyer and LoopyNow can monitor delivery status."
          }
        ]
      },
      {
        "no": "3.4",
        "title": "Refund Decisions",
        "blocks": [
          {
            "kind": "p",
            "text": "Where a Buyer requests a refund or return, the decision to accept or decline that request rests with the Seller, in accordance with the Refund & Return Policy in Section 6. LoopyNow's role is limited to facilitating the request, relaying communication between the parties, and assisting with dispute resolution where a Seller does not respond within a reasonable time. LoopyNow may, at its discretion, intervene in cases of clear Seller misconduct, non-delivery, or violation of Applicable Law."
          }
        ]
      },
      {
        "no": "3.5",
        "title": "Payouts and the 48-Hour Hold Period",
        "blocks": [
          {
            "kind": "p",
            "text": "Funds collected from a Buyer for an Order are held by LoopyNow for the Payout Hold Period of 48 hours from the date and time the Order is placed. During this period, the Order remains eligible for cancellation, dispute, or refund processing. Once the Payout Hold Period expires and no unresolved dispute exists, the applicable funds, net of fees, become eligible for release to the Seller's verified UPI ID or bank account, subject to the payout schedule described in the Seller Payout Policy in Section 8."
          },
          {
            "kind": "p",
            "text": "LoopyNow may extend the Payout Hold Period for a specific Order where a dispute, chargeback, or suspected fraud is under investigation, and will inform the Seller of the reason for any such extension."
          }
        ]
      },
      {
        "no": "3.6",
        "title": "Taxes",
        "blocks": [
          {
            "kind": "p",
            "text": "Sellers are solely responsible for determining, collecting, and remitting any Goods and Services Tax (GST), income tax, or other tax applicable to their sales, and for maintaining any registrations required under Applicable Law. LoopyNow does not provide tax advice and is not responsible for a Seller's tax compliance."
          }
        ]
      },
      {
        "no": "3.7",
        "title": "Seller Conduct",
        "blocks": [
          {
            "kind": "p",
            "text": "Sellers must not: manipulate reviews or ratings; misrepresent products; use another Seller's Content without authorisation; attempt to direct Buyers to transact outside the Platform to avoid fees; or engage in any conduct that undermines Buyer trust in the Platform. Breach of this section may result in suspension of the Seller Account under Section 2.5."
          }
        ]
      }
    ]
  },
  {
    "n": 4,
    "id": "buyer-terms",
    "title": "Buyer Terms",
    "intro": [
      {
        "kind": "p",
        "text": "This section sets out the specific terms that apply to Users who place Orders on the Platform as Buyers."
      }
    ],
    "subs": [
      {
        "no": "4.1",
        "title": "Buyer Information",
        "blocks": [
          {
            "kind": "p",
            "text": "To place an Order, a Buyer must provide a valid phone number, delivery address, and name. This information is shared with the relevant Seller solely for the purpose of fulfilling the Order and is handled in accordance with the Privacy Policy in Section 5."
          }
        ]
      },
      {
        "no": "4.2",
        "title": "Placing an Order",
        "blocks": [
          {
            "kind": "p",
            "text": "An Order is confirmed once payment has been successfully processed. LoopyNow will issue an Order confirmation and a tracking ID that the Buyer can use to monitor the status of their Order within the Platform."
          }
        ]
      },
      {
        "no": "4.3",
        "title": "Buyer Responsibilities",
        "blocks": [
          {
            "kind": "p",
            "text": "Buyers must provide accurate delivery details, be reasonably available to receive delivery, and inspect products promptly upon receipt. Buyers must raise any concern about a delivered product within the timeframe set out in the Refund & Return Policy. Buyers must not misuse the refund or dispute process to obtain products without payment, and repeated unfounded claims may result in restrictions on the Buyer's Account."
          }
        ]
      },
      {
        "no": "4.4",
        "title": "Payments and Platform Fee",
        "blocks": [
          {
            "kind": "p",
            "text": "The amount charged to a Buyer at checkout consists of the Listing price, any shipping charges set by the Seller, and a platform fee of 5% of the Order value charged by LoopyNow, each shown separately before payment is confirmed. Payment must be made using a payment method belonging to, or authorised by, an Adult, in accordance with Section 2.1; LoopyNow does not knowingly accept payment instruments held or operated independently by a minor. Payments are processed through third-party payment gateways integrated with the Platform. LoopyNow does not store full payment card details. By making a payment, the Buyer (or the Adult authorising the payment) authorises LoopyNow to collect the full checkout amount, to retain the platform fee, and to hold the remaining Order proceeds on behalf of the Seller during the Payout Hold Period described in Section 3.5."
          }
        ]
      },
      {
        "no": "4.5",
        "title": "Orders Placed by a Minor Without Authorisation",
        "blocks": [
          {
            "kind": "p",
            "text": "LoopyNow acknowledges that, notwithstanding Section 4.4, an Order may sometimes be placed using an Adult's saved or linked payment method by a minor without that Adult's knowledge or authorisation — for example, a parent's child placing an Order on the parent's Account or card. Where an Adult reports such an Order to support.loopynow.shop@gmail.com, LoopyNow will assist by raising the matter with the Seller who fulfilled the Order."
          },
          {
            "kind": "p",
            "text": "However, as set out in the Refund & Return Policy in Section 6, the decision to accept, decline, or partially accept the resulting return or refund request remains with the Seller. LoopyNow's role is limited to facilitating that request and does not extend to unilaterally reversing a payment that has already been made to, or held on behalf of, the Seller."
          }
        ]
      },
      {
        "no": "4.6",
        "title": "Buyer Account Confirmation",
        "blocks": [
          {
            "kind": "p",
            "text": "Where an Order involves a Payout or refund, LoopyNow may require confirmation through the Buyer's authenticated Google-linked Account before releasing funds or processing the request, to protect against unauthorised transactions."
          }
        ]
      }
    ]
  },
  {
    "n": 5,
    "id": "privacy-policy",
    "title": "Privacy Policy",
    "intro": [
      {
        "kind": "p",
        "text": "This Privacy Policy explains what personal information LoopyNow collects from Buyers and Sellers, how it is used, and the choices available to Users. It forms part of the Terms of Service."
      }
    ],
    "subs": [
      {
        "no": "5.1",
        "title": "Information We Collect",
        "blocks": [
          {
            "kind": "p",
            "text": "From Sellers, we collect:"
          },
          {
            "kind": "li",
            "text": "Email address and phone number;"
          },
          {
            "kind": "li",
            "text": "Seller name or business name;"
          },
          {
            "kind": "li",
            "text": "Seller address;"
          },
          {
            "kind": "li",
            "text": "Payout details: UPI ID, or bank account number, IFSC code, and account holder name."
          },
          {
            "kind": "p",
            "text": "From Buyers, we collect:"
          },
          {
            "kind": "li",
            "text": "Phone number, delivery address, and name;"
          },
          {
            "kind": "li",
            "text": "Order and tracking history;"
          },
          {
            "kind": "li",
            "text": "Payment confirmation data provided by our payment gateway (we do not store full card numbers)."
          },
          {
            "kind": "p",
            "text": "Where a User signs in with Google, we receive the name, email address, and profile details authorised by that User through Google's sign-in process. We also automatically collect limited technical data such as device type, browser type, and usage data through cookies, as described in the Cookie Policy in Section 9."
          }
        ]
      },
      {
        "no": "5.2",
        "title": "How We Use Information",
        "blocks": [
          {
            "kind": "li",
            "text": "To create and verify Buyer and Seller Accounts;"
          },
          {
            "kind": "li",
            "text": "To process Orders, payments, and Payouts;"
          },
          {
            "kind": "li",
            "text": "To connect Buyers and Sellers for the purpose of shipping and delivery;"
          },
          {
            "kind": "li",
            "text": "To communicate Order updates, tracking information, and support responses;"
          },
          {
            "kind": "li",
            "text": "To investigate disputes, fraud, and breaches of our policies;"
          },
          {
            "kind": "li",
            "text": "To comply with Applicable Law, including tax and consumer protection requirements;"
          },
          {
            "kind": "li",
            "text": "To improve and maintain the Platform."
          }
        ]
      },
      {
        "no": "5.3",
        "title": "Sharing of Information",
        "blocks": [
          {
            "kind": "p",
            "text": "We share Buyer contact and delivery details with the Seller fulfilling that Buyer's Order, solely for shipping purposes. We share limited Order and product information between Buyer and Seller to allow communication about an Order. We may share information with payment gateway providers to process transactions, with courier or logistics partners engaged by a Seller, and with regulators, law enforcement, or courts where required by Applicable Law. We do not sell personal information to third parties for marketing purposes."
          }
        ]
      },
      {
        "no": "5.4",
        "title": "Data Retention",
        "blocks": [
          {
            "kind": "p",
            "text": "We retain Account, Order, and payout information for as long as the Account remains active and for a reasonable period thereafter to comply with tax, accounting, and legal obligations, and to resolve any disputes. Users may request deletion of their Account, subject to retention of records required by Applicable Law."
          }
        ]
      },
      {
        "no": "5.5",
        "title": "Data Security",
        "blocks": [
          {
            "kind": "p",
            "text": "We apply reasonable technical and organisational measures to protect personal information against unauthorised access, alteration, or disclosure. No method of transmission or storage is completely secure, and Users are encouraged to protect their own Account credentials, including their linked Google account."
          }
        ]
      },
      {
        "no": "5.6",
        "title": "User Rights",
        "blocks": [
          {
            "kind": "p",
            "text": "Subject to Applicable Law, Users may request access to, correction of, or deletion of their personal information, and may withdraw consent to non-essential processing, by contacting support.loopynow.shop@gmail.com. We will respond within a reasonable time and in accordance with the Digital Personal Data Protection Act, 2023."
          }
        ]
      },
      {
        "no": "5.7",
        "title": "Children's Privacy",
        "blocks": [
          {
            "kind": "p",
            "text": "The Platform may be browsed by Users of any age, but Orders and payments require the involvement of an Adult, as described in Section 2.1. Where LoopyNow knows a User is under 18, it limits the processing of that User's personal information to what is necessary to operate the Platform and complete the relevant transaction, and does not use such information for behavioural monitoring or targeted advertising directed at children, in accordance with the Digital Personal Data Protection Act, 2023."
          },
          {
            "kind": "p",
            "text": "Where an Account or payment involves a User under 18, LoopyNow requires the verifiable consent of a parent or lawful guardian before processing that minor's personal information beyond what is necessary to complete the specific transaction. A parent or guardian may contact support.loopynow.shop@gmail.com to review, correct, or request deletion of a minor's information, or to withdraw consent, at any time."
          }
        ]
      },
      {
        "no": "5.8",
        "title": "Changes to this Policy",
        "blocks": [
          {
            "kind": "p",
            "text": "We may update this Privacy Policy from time to time. Material changes will be notified through the Platform. Continued use of the Platform after such notice constitutes acceptance of the updated policy."
          }
        ]
      }
    ]
  },
  {
    "n": 6,
    "id": "refund-return-policy",
    "title": "Refund & Return Policy",
    "intro": [
      {
        "kind": "p",
        "text": "This policy explains how refund and return requests are handled on the Platform. It applies to all Orders placed through LoopyNow."
      }
    ],
    "subs": [
      {
        "no": "6.1",
        "title": "Raising a Request",
        "blocks": [
          {
            "kind": "p",
            "text": "A Buyer who wishes to return a product or request a refund must raise the request through the Order details page within the Platform, describing the reason for the request, within a reasonable period after delivery (as specified on the relevant Listing, where applicable). The request is routed to the Seller who fulfilled the Order."
          }
        ]
      },
      {
        "no": "6.2",
        "title": "Seller Decision",
        "blocks": [
          {
            "kind": "p",
            "text": "The decision to accept, partially accept, or decline a refund or return request rests with the Seller. LoopyNow does not compel a Seller to issue a refund except where required by Applicable Law (for example, in cases of non-delivery, a materially defective product, or a product that differs substantially from its Listing) or where LoopyNow determines, following its own review, that the request is clearly justified."
          },
          {
            "kind": "p",
            "text": "Sellers are encouraged to respond to a refund request within a reasonable time. Where a Seller does not respond within the timeframe communicated to them, LoopyNow may escalate the matter as a dispute and assist in reaching a resolution, including by contacting the Seller directly."
          }
        ]
      },
      {
        "no": "6.3",
        "title": "The 48-Hour Payout Hold",
        "blocks": [
          {
            "kind": "p",
            "text": "Funds relating to an Order are held by LoopyNow for the Payout Hold Period described in Section 3.5. A refund request raised within this period, or before the Payout has otherwise been released, can generally be resolved by returning the held funds to the Buyer if the Seller agrees or if LoopyNow determines a refund is warranted. Where a Payout has already been released to the Seller, a refund requires the Seller's cooperation, and LoopyNow will assist in coordinating repayment."
          }
        ]
      },
      {
        "no": "6.4",
        "title": "Non-Refundable Situations",
        "blocks": [
          {
            "kind": "p",
            "text": "LoopyNow does not, as a matter of Platform policy, guarantee refunds for change of mind, buyer's remorse, or minor variations from a Listing that were reasonably disclosed, except where the Seller's own return policy for that Listing permits it or Applicable Law requires it."
          }
        ]
      },
      {
        "no": "6.5",
        "title": "Refund Method",
        "blocks": [
          {
            "kind": "p",
            "text": "Approved refunds are processed to the original payment method used for the Order, through our payment gateway, within a reasonable time after approval."
          }
        ]
      }
    ]
  },
  {
    "n": 7,
    "id": "shipping-policy",
    "title": "Shipping Policy",
    "intro": [],
    "subs": [
      {
        "no": "7.1",
        "title": "Seller Responsibility",
        "blocks": [
          {
            "kind": "p",
            "text": "Shipping and delivery of every Order is the sole responsibility of the Seller who fulfils that Order. LoopyNow does not operate its own courier or logistics service and does not take physical custody of products at any point. Sellers may choose their own courier or logistics partner, provided that delivery timelines and costs are accurately disclosed to Buyers at checkout."
          }
        ]
      },
      {
        "no": "7.2",
        "title": "Order Tracking",
        "blocks": [
          {
            "kind": "p",
            "text": "Every Order is assigned a tracking ID. Sellers must update the Order status and tracking information within the Platform promptly after dispatch so that Buyers can monitor delivery progress. Failure to update tracking information within a reasonable time may be treated as a service issue for the purposes of the Refund & Return Policy."
          }
        ]
      },
      {
        "no": "7.3",
        "title": "Delivery Issues",
        "blocks": [
          {
            "kind": "p",
            "text": "LoopyNow is not liable for delays, loss, or damage occurring during transit, as these fall within the Seller's shipping arrangements. However, LoopyNow will assist Buyers in raising the issue with the Seller and, where appropriate, in escalating a non-delivery complaint as a dispute under the Refund & Return Policy."
          }
        ]
      },
      {
        "no": "7.4",
        "title": "Shipping Charges",
        "blocks": [
          {
            "kind": "p",
            "text": "Any shipping charges are set and disclosed by the Seller on the relevant Listing or at checkout and are the Seller's responsibility to justify and apply consistently."
          }
        ]
      }
    ]
  },
  {
    "n": 8,
    "id": "seller-payout-policy",
    "title": "Seller Payout Policy",
    "intro": [],
    "subs": [
      {
        "no": "8.1",
        "title": "Payout Method",
        "blocks": [
          {
            "kind": "p",
            "text": "Payouts are made to the UPI ID or bank account (identified by account number, IFSC code, and account holder name) provided by the Seller during verification. Sellers are responsible for ensuring these details are accurate and current; LoopyNow is not liable for a Payout sent to an incorrect account resulting from outdated or incorrect details supplied by the Seller."
          }
        ]
      },
      {
        "no": "8.2",
        "title": "Payout Hold Period",
        "blocks": [
          {
            "kind": "p",
            "text": "As described in Section 3.5, funds for each Order are held for 48 hours from the Order date before becoming eligible for Payout. This hold period allows time for cancellation, dispute, or refund requests to be raised and resolved before funds are released."
          }
        ]
      },
      {
        "no": "8.3",
        "title": "Payout Schedule and Fees",
        "blocks": [
          {
            "kind": "p",
            "text": "LoopyNow's platform fee of 5% is charged to the Buyer at checkout, as described in Section 2.4, and is retained by LoopyNow directly from the checkout amount. It is not deducted from the Seller's Payout. Once the Payout Hold Period has expired and no unresolved dispute exists, the Seller receives the full Listing price and shipping charge for the Order, released to the Seller's designated account, less only any payment-gateway or bank charges that may apply and are disclosed in the seller dashboard."
          },
          {
            "kind": "p",
            "text": "LoopyNow reserves the right to introduce a separate Seller-side fee in the future, with reasonable advance notice as described in Section 2.4."
          }
        ]
      },
      {
        "no": "8.4",
        "title": "Withheld Payouts",
        "blocks": [
          {
            "kind": "p",
            "text": "LoopyNow may withhold a Payout, in whole or in part, where an Order is subject to an active dispute, suspected fraud, a chargeback, or a legal or regulatory requirement, until the matter is resolved. LoopyNow will inform the Seller of the reason for withholding a Payout where practicable."
          }
        ]
      }
    ]
  },
  {
    "n": 9,
    "id": "cancellation-policy",
    "title": "Cancellation Policy",
    "intro": [],
    "subs": [
      {
        "no": "9.1",
        "title": "Buyer-Initiated Cancellation",
        "blocks": [
          {
            "kind": "p",
            "text": "A Buyer may request cancellation of an Order before it has been dispatched by the Seller, through the Order details page. Once an Order has been marked as dispatched, cancellation is no longer available and the matter is instead handled under the Refund & Return Policy."
          }
        ]
      },
      {
        "no": "9.2",
        "title": "Seller-Initiated Cancellation",
        "blocks": [
          {
            "kind": "p",
            "text": "A Seller may cancel an Order prior to dispatch where the product is out of stock or cannot otherwise be fulfilled. In such cases, the full Order amount is returned to the Buyer."
          }
        ]
      },
      {
        "no": "9.3",
        "title": "Effect of Cancellation",
        "blocks": [
          {
            "kind": "p",
            "text": "A cancelled Order results in the release of held funds back to the Buyer through the original payment method, without requiring a separate refund request, provided cancellation occurs within the Payout Hold Period."
          }
        ]
      }
    ]
  },
  {
    "n": 10,
    "id": "cookie-policy",
    "title": "Cookie Policy",
    "intro": [],
    "subs": [
      {
        "no": "10.1",
        "title": "What Cookies We Use",
        "blocks": [
          {
            "kind": "p",
            "text": "The Platform uses cookies and similar technologies to keep Users signed in, remember preferences, understand how the Platform is used, and support Google Sign-In authentication. We use:"
          },
          {
            "kind": "li",
            "text": "Essential cookies, required for login, checkout, and core Platform functionality;"
          },
          {
            "kind": "li",
            "text": "Analytics cookies, used to understand usage patterns and improve the Platform;"
          },
          {
            "kind": "li",
            "text": "Authentication cookies, used to maintain a secure session after Google Sign-In."
          }
        ]
      },
      {
        "no": "10.2",
        "title": "Managing Cookies",
        "blocks": [
          {
            "kind": "p",
            "text": "Most browsers allow Users to control or delete cookies through their settings. Disabling essential cookies may prevent parts of the Platform, such as sign-in or checkout, from functioning correctly."
          }
        ]
      }
    ]
  },
  {
    "n": 11,
    "id": "disclaimer-and-limitation-of-liability",
    "title": "Disclaimer and Limitation of Liability",
    "intro": [],
    "subs": [
      {
        "no": "11.1",
        "title": "Marketplace Role",
        "blocks": [
          {
            "kind": "p",
            "text": "As set out in Section 1.2, LoopyNow is an intermediary that connects Buyers and Sellers. LoopyNow does not manufacture, inspect, or take possession of the products listed on the Platform, and does not guarantee the accuracy of any Listing, the quality or safety of any product, or the conduct of any Buyer or Seller."
          }
        ]
      },
      {
        "no": "11.2",
        "title": "Limitation of Liability",
        "blocks": [
          {
            "kind": "p",
            "text": "To the fullest extent permitted by Applicable Law, LoopyNow shall not be liable for indirect, incidental, or consequential loss arising from the use of the Platform, delays or failures in shipping, disputes between Buyers and Sellers, or fraudulent conduct by one User against another as described in the Fraud Prevention and Enforcement Policy in Section 15. This limitation does not exclude any liability that cannot lawfully be excluded under the Consumer Protection Act, 2019 or other Applicable Law, including liability arising from LoopyNow's own acts or omissions as an intermediary."
          }
        ]
      },
      {
        "no": "11.3",
        "title": "No Warranty",
        "blocks": [
          {
            "kind": "p",
            "text": "The Platform is provided on an \"as is\" and \"as available\" basis. While we take reasonable steps to keep the Platform available and secure, we do not warrant that it will be uninterrupted or error-free."
          }
        ]
      }
    ]
  },
  {
    "n": 12,
    "id": "grievance-redressal-policy",
    "title": "Grievance Redressal Policy",
    "intro": [],
    "subs": [
      {
        "no": "12.1",
        "title": "Grievance Officer",
        "blocks": [
          {
            "kind": "p",
            "text": "In accordance with the Information Technology Act, 2000 and the Consumer Protection (E-Commerce) Rules, 2020, LoopyNow has appointed a Grievance Officer to address complaints from Users:"
          },
          {
            "kind": "li",
            "text": "Name: [Grievance Officer Name]"
          },
          {
            "kind": "li",
            "text": "Email: support.loopynow.shop@gmail.com"
          },
          {
            "kind": "li",
            "text": "Address: [Registered Office Address, to be inserted upon business registration]"
          }
        ]
      },
      {
        "no": "12.2",
        "title": "Process",
        "blocks": [
          {
            "kind": "p",
            "text": "A User may submit a grievance relating to a Listing, an Order, a Payout, or any breach of these policies by emailing support.loopynow.shop@gmail.com with the Order or Account details concerned. LoopyNow will acknowledge the grievance and aim to resolve it within the timelines prescribed by Applicable Law."
          }
        ]
      }
    ]
  },
  {
    "n": 13,
    "id": "prohibited-products-policy",
    "title": "Prohibited Products Policy",
    "intro": [],
    "subs": [
      {
        "no": "13.1",
        "title": "General Prohibition",
        "blocks": [
          {
            "kind": "p",
            "text": "Sellers must not list or sell products that are illegal, counterfeit, unsafe, or otherwise prohibited under Applicable Law, including but not limited to:"
          },
          {
            "kind": "li",
            "text": "Narcotics, controlled substances, and drug paraphernalia;"
          },
          {
            "kind": "li",
            "text": "Firearms, ammunition, and weapons regulated under Indian law;"
          },
          {
            "kind": "li",
            "text": "Counterfeit or unauthorised replicas of branded goods;"
          },
          {
            "kind": "li",
            "text": "Products that infringe a third party's intellectual property rights;"
          },
          {
            "kind": "li",
            "text": "Hazardous, restricted, or banned chemicals and substances;"
          },
          {
            "kind": "li",
            "text": "Products regulated by law that require a licence the Seller does not hold, such as certain pharmaceuticals;"
          },
          {
            "kind": "li",
            "text": "Any product the sale of which is otherwise prohibited or restricted under Indian law."
          }
        ]
      },
      {
        "no": "13.2",
        "title": "Enforcement",
        "blocks": [
          {
            "kind": "p",
            "text": "LoopyNow may remove a Listing that appears to breach this policy without prior notice and may suspend the Seller's Account for repeated or serious breaches, in accordance with Section 2.5."
          }
        ]
      }
    ]
  },
  {
    "n": 14,
    "id": "community-guidelines",
    "title": "Community Guidelines",
    "intro": [],
    "subs": [
      {
        "no": "14.1",
        "title": "Respectful Conduct",
        "blocks": [
          {
            "kind": "p",
            "text": "All Users are expected to communicate respectfully with one another, whether resolving an Order query, leaving a review, or raising a dispute. Harassment, threats, discriminatory remarks, or abusive language directed at another User or at LoopyNow staff will not be tolerated."
          }
        ]
      },
      {
        "no": "14.2",
        "title": "Honest Reviews",
        "blocks": [
          {
            "kind": "p",
            "text": "Reviews and ratings must reflect a genuine experience with a product or Seller. Fake reviews, incentivised reviews that are not disclosed as such, and review manipulation are prohibited."
          }
        ]
      },
      {
        "no": "14.3",
        "title": "Reporting",
        "blocks": [
          {
            "kind": "p",
            "text": "Users who witness a breach of these Community Guidelines may report it to support.loopynow.shop@gmail.com. LoopyNow will review reports and may take action ranging from a warning to Account suspension, in accordance with Section 2.5."
          }
        ]
      }
    ]
  },
  {
    "n": 15,
    "id": "fraud-prevention-and-enforcement-policy",
    "title": "Fraud Prevention and Enforcement Policy",
    "intro": [
      {
        "kind": "p",
        "text": "LoopyNow operates purely as a bridge connecting Buyers and Sellers, as described in Section 1.2. This section explains how LoopyNow handles fraud committed by a Buyer or a Seller against the other party."
      }
    ],
    "subs": [
      {
        "no": "15.1",
        "title": "No Liability for Fraud Between Users",
        "blocks": [
          {
            "kind": "p",
            "text": "LoopyNow is not accountable for fraudulent conduct committed by a Buyer against a Seller, or by a Seller against a Buyer, including but not limited to non-delivery, delivery of counterfeit, wrong, or misrepresented products, fraudulent refund or return claims, fraudulent payment disputes, or any other attempt by one User to scam another. As an intermediary, LoopyNow does not guarantee, insure, or itself compensate either party for losses arising from another User's fraudulent conduct, including any consequent refund or shipping loss. This is without prejudice to any liability that cannot lawfully be excluded under Applicable Law."
          }
        ]
      },
      {
        "no": "15.2",
        "title": "Investigation and Determination of Responsibility",
        "blocks": [
          {
            "kind": "p",
            "text": "Where a User reports suspected fraud, LoopyNow will review the available evidence, including Order details, tracking information, and communication between the parties, to determine which party appears responsible. Where the evidence indicates the Seller is responsible, LoopyNow will direct the Seller to return the payment to the Buyer. Where the Seller does so, the matter is treated as resolved under the Refund & Return Policy. Where the evidence indicates the Buyer is responsible, for example through a false or abusive fraud claim, LoopyNow will treat this as a breach of these Terms by the Buyer."
          },
          {
            "kind": "p",
            "text": "LoopyNow's role in this process is limited to investigation, direction, and enforcement as set out below. LoopyNow does not itself refund, reimburse, or otherwise make either party financially whole for losses caused by the other party's fraud."
          }
        ]
      },
      {
        "no": "15.3",
        "title": "Enforcement Action",
        "blocks": [
          {
            "kind": "p",
            "text": "Regardless of whether the responsible party is a Buyer or a Seller, LoopyNow will take strict action against whichever User is found responsible for the fraud, which may include a formal warning, removal of the relevant Listing, restriction of Account features, withholding of pending Payouts related to the matter, temporary suspension, or permanent termination of the Account under Section 2.5. LoopyNow may also report confirmed fraud to law enforcement or other competent authorities where appropriate."
          }
        ]
      },
      {
        "no": "15.4",
        "title": "No Fund Guarantee",
        "blocks": [
          {
            "kind": "p",
            "text": "Users acknowledge that LoopyNow does not maintain a compensation fund for losses caused by another User's fraud. LoopyNow's commitment is to investigate reported fraud promptly, direct the responsible party to correct the situation where appropriate, and take enforcement action against that party — not to personally guarantee or fund the outcome of a dispute between Users."
          }
        ]
      }
    ]
  }
];

/** Look one section up by its slug. */
export const legalSection = (id: string) => LEGAL_SECTIONS.find((s) => s.id === id);

/** Several sections at once, in the order given. */
export const legalSections = (...ids: string[]) =>
  ids.map((id) => legalSection(id)).filter(Boolean) as LegalSection[];
