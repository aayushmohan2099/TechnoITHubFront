import React from "react";
import { FaRobot } from "react-icons/fa";

const DeploymentBotHealth = () => {
  return (
    <div className="p-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-3 text-ettm-blue">
            <FaRobot size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Deployment Bot Health
            </h1>

            <p className="text-sm text-gray-500">
              Monitor deployment bot health and status
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
          <p className="text-gray-600">
            Deployment Bot Health module will be available here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeploymentBotHealth;
