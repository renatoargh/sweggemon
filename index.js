function getType (value) {
  if (value instanceof Date) {
    return 'string'
  }

  return typeof value
}

function getFormat (value) {
  if (value instanceof Date) {
    return 'date-time'
  }
}

function isSchema (object) {
  return object.constructor.name === 'Schema'
}

function isSchemaArray (object) {
  return Array.isArray(object) && isSchema(object[0])
}

module.exports = function (models) {
  const swaggerDefinitions = {}

  Object.entries(models).forEach(([modelName, Model]) => {
    let exampleValues = {}

    const swaggerDefinition = {}
    Object.entries(Model.schema.obj || {}).forEach(([property, propertyAttributes]) => {
      if (isSchemaArray(propertyAttributes)) {
        return
      }

      if (!propertyAttributes['__example'] && !propertyAttributes.ref) {
        throw new Error(`No example given to "${modelName}.${property}"`)
      }

      exampleValues[property] = propertyAttributes['__example']
    })

    exampleValues = new Model(exampleValues).public()

    Object.entries(exampleValues).forEach(([key, value]) => {
      swaggerDefinition[key] = {
        type: getType(value),
        format: getFormat(value),
        example: value
      }
    })

    Object.entries(Model.schema.obj || {}).forEach(([property, propertyAttributes]) => {
      if (!propertyAttributes.ref && !isSchemaArray(propertyAttributes)) {
        return
      }

      let Model
      if (propertyAttributes.ref) {
        Model = propertyAttributes.ref
      }

      if (isSchemaArray(propertyAttributes)) {
        const { modelName } = propertyAttributes[0].statics

        if (!modelName) {
          throw new Error('modelName not provided for schema')
        }

        Model = modelName
      }

      if (Model) {
        swaggerDefinition[property] = {
          type: 'object',
          items: {
            $ref: '#/definitions/' + Model
          }
        }
      }
    })

    swaggerDefinitions[modelName] = {
      type: 'object',
      properties: swaggerDefinition
    }
  })

  return swaggerDefinitions
}
