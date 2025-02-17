import db from "../config/db.js";

// ===================================================tax entry=============================================
export const taxHandler = async (req, res) => {
    try {
        const { tax_name, rate, type, accd, sub_accd, entry_date, lm_date, s_code, exempted, per_amount, from_amount_per, to_amount_per, p_tax_id, remarks, created_by, restricted_from_value, restricted_to_value, enc_type, card_no } = req.body;

        // if (!tax_name|| !rate || !rate1 || !type || !accd || !sub_accd || !fnc_year || !entry_date || !lm_date || !short_name || !exempted || !per_amount_type || !from_amount_per || !to_amount_per || !p_tax_id || !remarks || !created_by || !restricted_from_value || !restricted_to_value || !enc_type || !card_no) {
        //     return res.status(400).json({ status: false, error: 'All fields are required' });
        // }

        const counter = await db.collection('counters').findOne({ _id: "tax_counter_id" });
        let nextTaxCounterId;

        if (counter) {
            nextTaxCounterId = counter.sequence_value + 1;
            await db.collection('counters').updateOne(
                { _id: "tax_counter_id" },
                { $set: { sequence_value: nextTaxCounterId } }
            );
        } else {
            nextTaxCounterId = 1;
            await db.collection('counters').insertOne({
                _id: "tax_counter_id",
                sequence_value: nextTaxCounterId
            });
        }

        function getCurrentFinancialYear() {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;

            return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
        }

        const tax_details = {
            tax_row_id: nextTaxCounterId,
            tax_id: nextTaxCounterId,
            tax_name: tax_name || "",
            rate: rate || "",
            rate1: rate || "",
            type: type || "",
            accd: accd || "",
            sub_accd: sub_accd || "",
            fnc_year: getCurrentFinancialYear() || "",
            entry_date: entry_date || "",
            lm_date: lm_date || "",
            s_code: s_code || "",
            exempted: exempted || "",
            per_amount: per_amount || "",
            from_amount_per: from_amount_per || "",
            to_amount_per: to_amount_per || "",
            p_tax_id: p_tax_id || "",
            remarks: remarks || "",
            restricted_from_value: restricted_from_value || "",
            restricted_to_value: restricted_to_value || "",
            created_by: created_by || "",
            enc_type: enc_type || "",
            card_no: card_no || "",
            created_at: new Date().toLocaleString(),
            ulm: new Date().toLocaleString(),
            dlm: new Date().toLocaleString(),
            is_active: 1,
        }
        const result = await db.collection("M_tax").insertOne(tax_details);
        res.status(200).json({
            status: true,
            message: "Tax created successfully.",
            result: result,
        })

    } catch (error) {
        console.error('Error on tax handler:', error);
        res.status(500).json({
            status: false,
            message: 'Internal Server Error',
        });
    }
}

// ===================================================tax item wise entry=============================================
export const taxItemwise = async (req, res) => {
    try {
        const { tax_item_id1, tax_id1, item_id1, onper1, created_by, created_by1, tax_item_id, tax_id, item_id, onper } = req.body;

        if (!tax_item_id1 || !tax_id1 || !item_id1 || !onper1 || !tax_item_id || !tax_id || !item_id || !onper || !created_by || !created_by1) {
            return res.status(400).json({ status: false, error: 'All fields are required' });
        }

        const counter = await db.collection('counters').findOne({ _id: "tax_itemwise_counter_id" });
        let nextTaxItemwiseCounterId;

        // setting the id as next sequence value else created one 
        if (counter) {
            nextTaxItemwiseCounterId = counter.sequence_value + 1;
            await db.collection('counters').updateOne(
                { _id: "tax_itemwise_counter_id" },
                { $set: { sequence_value: nextTaxItemwiseCounterId } }
            );
        } else {
            nextTaxItemwiseCounterId = 1;
            await db.collection('counters').insertOne({
                _id: "tax_itemwise_counter_id",
                sequence_value: nextTaxItemwiseCounterId
            });
        }

        const tax_details = {
            row_id: nextTaxItemwiseCounterId,
            tax_id: tax_id,
            tax_id1: tax_id1,
            tax_item_id: tax_item_id,
            tax_item_id1: tax_item_id1,
            item_id: item_id,
            item_id1: item_id1,
            onper: onper,
            onper1: onper1,
            created_by: created_by,
            created_by1: created_by1,
            created_at: new Date().toLocaleString(),
            created_at1: new Date().toLocaleString(),
            ulm: new Date().toLocaleString(),
            ulm1: new Date().toLocaleString(),
            dlm: new Date().toLocaleString(),
            dlm1: new Date().toLocaleString(),
            lmdt1: new Date().toLocaleString(),
            lmdt: new Date().toLocaleString(),
            active: 1,
            active1: 1,
        }
        const result = await db.collection("M_tax_itemwise").insertOne(tax_details);
        res.status(200).json({
            status: true,
            message: result
        })

    } catch (error) {
        console.error('Error on itemwise tax handler:', error);
        res.status(500).json({
            status: false,
            message: 'Internal Server Error',
        });
    }
}

// ===================================================tax location wise entry=============================================
export const taxLocationWise = async (req, res) => {
    try {
        const { item_cd, tax_id } = req.body;

        if (!Array.isArray(item_cd) || !Array.isArray(tax_id) || item_cd.length === 0 || tax_id.length === 0) {
            return res.status(400).json({ status: false, error: 'item_cd and tax_id must be non-empty arrays' });
        }

        let taxDetailsArray = [];
        const counter = await db.collection('counters').findOne({ _id: "tax_location_counter_id" });
        let nextLocTaxId = counter ? counter.sequence_value + 1 : 1;
      
        item_cd.forEach((item) => {
            tax_id.forEach((tax) => {
                taxDetailsArray.push({
                    loc_tax_id: nextLocTaxId++,
                    item_cd: item,
                    loc_code: "100",
                    tax_id: tax,
                    bill_item_wise: "B",
                    onper: "100",
                    country_code: "IND",
                    is_active: 1,
                    ulm: new Date().toLocaleString(),
                    dlm: new Date().toLocaleString(),
                });
            });
        });
      
        const result = await db.collection("M_tax_locationwise").insertMany(taxDetailsArray);
      
        await db.collection('counters').updateOne(
            { _id: "tax_location_counter_id" },
            { $set: { sequence_value: nextLocTaxId - 1 } },
            { upsert: true }
        );

        res.status(200).json({
            status: true,
            message: "Tax setup successfully.",
        });

    } catch (error) {
        console.error('Error on itemwise tax handler:', error);
        res.status(500).json({
            status: false,
            message: 'Internal Server Error',
        });
    }
};

// ===================================================tax bill table entry=============================================
export const taxBillTable = async (req, res) => {
    try {
        const { billno_tax_id, orderno, bill_or_itemwise, tax_id, tax_name, tax_amt, createdby, createddate, ulm, dlm, active
        } = req.body;

        if (!billno_tax_id || !orderno || !bill_or_itemwise || !tax_id || !tax_name || !tax_amt || !createdby) {
            return res.status(400).json({ status: false, error: 'All fields are required' });
        }

        const counter = await db.collection('counters').findOne({ _id: "tax_bill_table_counter_id" });
        let nextTaxBillTableId;

        // setting the id as next sequence value else created one 
        if (counter) {
            nextTaxBillTableId = counter.sequence_value + 1;
            await db.collection('counters').updateOne(
                { _id: "tax_bill_table_counter_id" },
                { $set: { sequence_value: nextTaxBillTableId } }
            );
        } else {
            nextTaxBillTableId = 1;
            await db.collection('counters').insertOne({
                _id: "tax_bill_table_counter_id",
                sequence_value: nextTaxBillTableId
            });
        }

        const tax_details = {
            billno_tax_id: billno_tax_id,
            orderno: orderno,
            bill_or_itemwise: bill_or_itemwise,
            tax_id: tax_id,
            tax_name: tax_name,
            tax_amt: tax_amt,
            createdby: createdby,
            created_at: new Date().toLocaleString(),
            ulm: new Date().toLocaleString(),
            dlm: new Date().toLocaleString(),
            active: 1,
        }
        const result = await db.collection("M_tax_bill_table").insertOne(tax_details);
        res.status(200).json({
            status: true,
            message: result
        })

    } catch (error) {
        console.error('Error on itemwise tax handler:', error);
        res.status(500).json({
            status: false,
            message: 'Internal Server Error',
        });
    }
}

// ================================================tax list=======================================================
export const taxList = async (req, res) => {
    try {
        const collection = db.collection("M_tax");
        const taxes = await collection.find(
            {},
            { projection: { tax_id: 1, tax_name: 1, rate: 1, is_active: 1, _id: 0 } }
        ).toArray();

        res.status(200).json({
            status: 200,
            success: true,
            message: "Tax details fetched successfully",
            data: taxes
        });
    } catch (error) {
        console.error("❌ Error fetching tax details:", error);
        res.status(500).json({ status: 500, success: false, message: "Internal Server Error" });
    }
};