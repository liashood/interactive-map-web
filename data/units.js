window.DAMAC_UNITS = {
  sale: window.DAMAC_SALE_AVAILABILITY || [],
  rent: window.DAMAC_RENT_AVAILABILITY || [],

  normalizeClusterName(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  },

  getSaleByCluster(clusterName) {
    const target = this.normalizeClusterName(clusterName);

    return this.sale.filter((unit) => {
      return this.normalizeClusterName(unit.cluster) === target;
    });
  },

  getRentByCluster(clusterName) {
    const target = this.normalizeClusterName(clusterName);

    return this.rent.filter((unit) => {
      return this.normalizeClusterName(unit.cluster) === target;
    });
  },

  getAvailabilityByCluster(clusterName) {
    return {
      sale: this.getSaleByCluster(clusterName),
      rent: this.getRentByCluster(clusterName),
    };
  },
};