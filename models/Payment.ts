import mongoose, { type InferSchemaType, Schema } from "mongoose";

const paymentSchema = new Schema(
	{
		// One sandbox payment intent per booking, with a stable provider reference.
		_id: { type: Schema.Types.ObjectId, required: true },
		mode: { type: String, enum: ["sandbox"], required: true },
		amountMinor: { type: Number, required: true },
		currency: { type: String, required: true },
		commissionBasisPoints: { type: Number, required: true },
		status: {
			type: String,
			enum: ["pending", "failed", "captured", "refund_required"],
			required: true,
		},
		sequence: { type: Number, default: 0 },
	},
	{ timestamps: true },
);

const paymentEventSchema = new Schema({
	_id: { type: String, required: true },
	paymentId: { type: Schema.Types.ObjectId, required: true, index: true },
	mode: { type: String, enum: ["sandbox"], required: true },
	kind: { type: String, enum: ["succeeded", "failed"], required: true },
	outcome: {
		type: String,
		enum: [
			"confirmed",
			"failed",
			"ignored",
			"refund_required",
			"amount_mismatch",
		],
		required: true,
	},
	amountMinor: { type: Number, required: true },
	currency: { type: String, required: true },
	verifiedAt: { type: Date, required: true },
});

const ledgerEntrySchema = new Schema({
	_id: { type: String, required: true },
	paymentId: { type: Schema.Types.ObjectId, required: true, index: true },
	mode: { type: String, enum: ["sandbox"], required: true },
	tutorId: { type: String, required: true },
	kind: {
		type: String,
		enum: ["platform_commission", "pending_tutor_earning"],
		required: true,
	},
	amountMinor: { type: Number, required: true },
	currency: { type: String, required: true },
	recordedAt: { type: Date, required: true },
});

export const Payment =
	(mongoose.models.Payment as mongoose.Model<
		InferSchemaType<typeof paymentSchema>
	>) ?? mongoose.model("Payment", paymentSchema);
export const PaymentEvent =
	(mongoose.models.PaymentEvent as mongoose.Model<
		InferSchemaType<typeof paymentEventSchema>
	>) ?? mongoose.model("PaymentEvent", paymentEventSchema);
export const LedgerEntry =
	(mongoose.models.LedgerEntry as mongoose.Model<
		InferSchemaType<typeof ledgerEntrySchema>
	>) ?? mongoose.model("LedgerEntry", ledgerEntrySchema);
