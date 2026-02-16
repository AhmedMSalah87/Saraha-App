export class DatabaseRepository {
  constructor(model) {
    this.model = model;
  }
  async create(data) {
    return this.model.create(data);
  }

  findAll(filter = {}, projection = {}, options = {}) {
    return this.model.find(filter, projection, options);
  }

  async findOne(filter, projection = {}, options = {}) {
    return this.model.findOne(filter, projection, options);
  }

  async findById(id, projection = {}, options = {}) {
    return this.model.findById(id, projection, options);
  }

  async update(id, data, options = {}) {
    return this.model.findByIdAndUpdate(id, data, options);
  }

  async delete(id, options = {}) {
    return this.model.findByIdAndDelete(id, options);
  }
}
