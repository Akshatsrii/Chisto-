const cron = require("node-cron");
const orderModel = require("./models/orderModel");

const initCronJobs = (io) => {
  // Run every minute for demonstration (In production, usually run once a day at midnight '0 0 * * *')
  // We check if there are scheduled orders whose scheduled date is today or in the past
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      // Find orders that are scheduled but their time has arrived
      const scheduledOrders = await orderModel.find({
        isScheduled: true,
        status: "Scheduled (Awaiting Date)",
        scheduledDate: { $lte: now }
      });

      if (scheduledOrders.length > 0) {
        console.log(`[Cron] Found ${scheduledOrders.length} scheduled orders to activate.`);

        for (const order of scheduledOrders) {
          order.status = "Food Processing";
          await order.save();

          // Notify User & Restaurant via Socket.io
          if (io) {
            io.to(order._id.toString()).emit("order_status_update", { 
              orderId: order._id, 
              status: "Food Processing",
              message: `Your scheduled order for ${order.travelDetails?.type} (${order.travelDetails?.pnrOrFlightNumber}) is now active and being processed!`
            });
          }
        }
      }
    } catch (error) {
      console.error("[Cron] Error processing scheduled orders:", error);
    }
  });
};

module.exports = initCronJobs;
